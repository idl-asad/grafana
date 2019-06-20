import _ from 'lodash';
import { colors, getColorFromHexRgbOrName } from '@grafana/ui';
import TimeSeries from 'app/core/time_series2';
import config from 'app/core/config';
import { LegacyResponseData, TimeRange } from '@grafana/ui';

type Options = {
  dataList: LegacyResponseData[];
  range?: TimeRange;
};

export class DataProcessor {
  constructor(private panel) {
    console.log(this.panel);
  }

  getSeriesList(options: Options): TimeSeries[] {
    if (!options.dataList || options.dataList.length === 0) {
      return [];
    }

    // auto detect xaxis mode
    let firstItem;
    if (options.dataList && options.dataList.length > 0) {
      firstItem = options.dataList[0];
      const autoDetectMode = this.getAutoDetectXAxisMode(firstItem);
      if (this.panel.xaxis.mode !== autoDetectMode) {
        this.panel.xaxis.mode = autoDetectMode;
        this.setPanelDefaultsForNewXAxisMode();
      }
    }

    switch (this.panel.xaxis.mode) {
      case 'series':
      case 'time': {
        return options.dataList.map((item, index) => {
          return this.timeSeriesHandler(item, index, options);
        });
      }
      case 'histogram': {
        let histogramDataList;
        if (this.panel.stack) {
          histogramDataList = options.dataList;
        } else {
          histogramDataList = [
            {
              target: 'count',
              datapoints: _.concat([], _.flatten(_.map(options.dataList, 'datapoints'))),
            },
          ];
        }
        return histogramDataList.map((item, index) => {
          return this.timeSeriesHandler(item, index, options);
        });
      }
      case 'table': {
        return this.customHandler(options.dataList[0]);
      }
    }

    return [];
  }

  getAutoDetectXAxisMode(firstItem) {
    switch (firstItem.type) {
      case 'docs':
        return 'table';
      case 'table':
        return 'table';
      default: {
        if (this.panel.xaxis.mode === 'series') {
          return 'series';
        }
        if (this.panel.xaxis.mode === 'histogram') {
          return 'histogram';
        }
        return 'time';
      }
    }
  }

  setPanelDefaultsForNewXAxisMode() {
    switch (this.panel.xaxis.mode) {
      case 'time': {
        this.panel.bars = false;
        this.panel.lines = true;
        this.panel.points = false;
        this.panel.legend.show = true;
        this.panel.tooltip.shared = true;
        this.panel.xaxis.values = [];
        break;
      }
      case 'series': {
        this.panel.bars = true;
        this.panel.lines = false;
        this.panel.points = false;
        this.panel.stack = false;
        this.panel.legend.show = false;
        this.panel.tooltip.shared = false;
        this.panel.xaxis.values = ['total'];
        break;
      }
      case 'histogram': {
        this.panel.bars = true;
        this.panel.lines = false;
        this.panel.points = false;
        this.panel.stack = false;
        this.panel.legend.show = false;
        this.panel.tooltip.shared = false;
        break;
      }
      case 'table': {
        this.panel.bars = false;
        this.panel.lines = true;
        this.panel.points = false;
        this.panel.legend.show = true;
        this.panel.tooltip.shared = true;
        this.panel.xaxis.values = ['total'];
        break;
      }
    }
  }

  timeSeriesHandler(seriesData: LegacyResponseData, index: number, options: Options) {
    const datapoints = seriesData.datapoints || [];
    const alias = seriesData.target;

    const colorIndex = index % colors.length;

    const color = this.panel.aliasColors[alias] || colors[colorIndex];

    const series = new TimeSeries({
      datapoints: datapoints,
      alias: alias,
      color: getColorFromHexRgbOrName(color, config.theme.type),
      unit: seriesData.unit,
    });

    if (datapoints && datapoints.length > 0) {
      const last = datapoints[datapoints.length - 1][1];
      const from = options.range.from;

      if (last - from.valueOf() < -10000) {
        series.isOutsideRange = true;
      }
    }

    return series;
  }

  customHandler(dataItem) {
    let xaxisFieldIndex = -1;
    let seriesData;
    const series = [];
    const nameField = this.panel.xaxis.name;
    const xAxisDataType = this.panel.xaxis.xaxisDataType;
    const yAxisColumns = this.panel.xaxis.yAxesColumns.replace(/ /g, '').split(',');

    if (!nameField) {
      throw {
        message: 'No column specified to use for x-axis, check your axes settings',
      };
    }

    if (!yAxisColumns[0]) {
      throw {
        message: 'No column specified to use for y-axis, check your axes settings',
      };
    }

    yAxisColumns.forEach(col => {
      if (!this.validateAxisColumns(col, dataItem.columns)) {
        throw {
          message: 'Column specified to use for y-axis, does not exist',
        };
      }
    });

    if (!this.validateAxisColumns(nameField, dataItem.columns)) {
      throw {
        message: 'Column specified to use for x-axis, does not exist',
      };
    }

    dataItem.columns.forEach((item, index) => {
      if (item.text === nameField) {
        xaxisFieldIndex = index;
      }
    });

    if (xAxisDataType !== typeof dataItem.rows[0][xaxisFieldIndex]) {
      dataItem.rows = this.castDataType(dataItem.rows, xaxisFieldIndex, xAxisDataType);
    }

    dataItem.columns.forEach((col, index) => {
      if (yAxisColumns.indexOf(col.text) !== -1) {
        seriesData = dataItem.rows.map(row => {
          return [row[index], row[xaxisFieldIndex]];
        });
        const alias = dataItem.columns[index].text;
        const colorIndex = index % colors.length;
        const color = this.panel.aliasColors[alias] || colors[colorIndex];
        if (this.panel.aggregationType !== 'none' && typeof dataItem.rows[0][1] === 'number') {
          seriesData = this.aggregateData(seriesData);
        }
        series.push(
          new TimeSeries({
            datapoints: seriesData,
            alias: alias,
            color: color,
          })
        );
      }
    });
    return series;
  }

  validateAxisColumns(name, columnList): boolean {
    let isFound = false;
    columnList.forEach(col => {
      if (col.text === name) {
        isFound = true;
      }
    });
    return isFound;
  }

  aggregateData(data) {
    const aggregatedSeriesData = [];
    const uniqueData = new Object();
    data.forEach(arr => {
      if (!uniqueData[arr[1]]) {
        uniqueData[arr[1]] = new Object();
        uniqueData[arr[1]]['values'] = new Array();
      }
      uniqueData[arr[1]]['values'].push(arr[0]);
    });
    const keys = Object.keys(uniqueData);
    for (let i = 0; i < keys.length; i++) {
      switch (this.panel.aggregationType) {
        case 'avg':
          uniqueData[keys[i]]['avg'] = _.meanBy(uniqueData[keys[i]].values);
          break;
        case 'min':
          uniqueData[keys[i]]['min'] = _.min(uniqueData[keys[i]].values);
          break;
        case 'max':
          uniqueData[keys[i]]['max'] = _.max(uniqueData[keys[i]].values);
          break;
        case 'total':
          uniqueData[keys[i]]['total'] = _.sum(uniqueData[keys[i]].values);
          break;
        case 'count':
          uniqueData[keys[i]]['count'] = uniqueData[keys[i]].values.length;
          break;
        case 'current':
          uniqueData[keys[i]]['count'] = uniqueData[keys[i]].values.length;
          break;
      }
    }
    for (let i = 0; i < keys.length; i++) {
      const keyVal = isNaN(parseInt(keys[i], 10)) ? keys[i] : parseInt(keys[i], 10);
      aggregatedSeriesData.push([uniqueData[keys[i]][this.panel.aggregationType], keyVal]);
    }
    return aggregatedSeriesData;
  }

  castDataType(data, xaxisFieldIndex, xaxisxAxisDataType) {
    if (xaxisxAxisDataType === 'number') {
      data.forEach(item => {
        item[xaxisFieldIndex] = parseInt(item[xaxisFieldIndex], 10);
      });
    } else {
      data.forEach(item => {
        item[xaxisFieldIndex] = item[xaxisFieldIndex].toString();
      });
    }
    data.sort((a, b) => {
      // tslint:disable-next-line:curly
      if (a[xaxisFieldIndex] < b[xaxisFieldIndex]) return -1;
      // tslint:disable-next-line:curly
      if (a[xaxisFieldIndex] > b[xaxisFieldIndex]) return 1;
      return 0;
    });
    return data;
  }

  validateXAxisSeriesValue() {
    switch (this.panel.xaxis.mode) {
      case 'series': {
        if (this.panel.xaxis.values.length === 0) {
          this.panel.xaxis.values = ['total'];
          return;
        }

        const validOptions = this.getXAxisValueOptions({});
        const found: any = _.find(validOptions, { value: this.panel.xaxis.values[0] });
        if (!found) {
          this.panel.xaxis.values = ['total'];
        }
        return;
      }
    }
  }

  getDataFieldNames(dataList, onlyNumbers) {
    if (dataList.length === 0) {
      return [];
    }

    const fields = [];
    const firstItem = dataList[0];
    const fieldParts = [];

    function getPropertiesRecursive(obj) {
      _.forEach(obj, (value, key) => {
        if (_.isObject(value)) {
          fieldParts.push(key);
          getPropertiesRecursive(value);
        } else {
          if (!onlyNumbers || _.isNumber(value)) {
            const field = fieldParts.concat(key).join('.');
            fields.push(field);
          }
        }
      });
      fieldParts.pop();
    }

    if (firstItem.type === 'docs') {
      if (firstItem.datapoints.length === 0) {
        return [];
      }
      getPropertiesRecursive(firstItem.datapoints[0]);
    }

    return fields;
  }

  getXAxisValueOptions(options) {
    switch (this.panel.xaxis.mode) {
      case 'series': {
        return [
          { text: 'Avg', value: 'avg' },
          { text: 'Min', value: 'min' },
          { text: 'Max', value: 'max' },
          { text: 'Total', value: 'total' },
          { text: 'Count', value: 'count' },
        ];
      }
    }

    return [];
  }

  pluckDeep(obj: any, property: string) {
    const propertyParts = property.split('.');
    let value = obj;
    for (let i = 0; i < propertyParts.length; ++i) {
      if (value[propertyParts[i]]) {
        value = value[propertyParts[i]];
      } else {
        return undefined;
      }
    }
    return value;
  }
}
