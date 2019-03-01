import React, { FC } from 'react';
import _ from 'lodash';
import DropDownChild from './DropDownChild';
import { NavModelItem } from '@grafana/data';

interface Props {
  link: NavModelItem;
}

const SideMenuDropDown: FC<Props> = props => {
  const { link } = props;
  let childrenLinks: NavModelItem[] = [];
  if (link.children) {
    childrenLinks = _.filter(link.children, item => !item.hideFromMenu);
  }

  const redirect = () => {
    if (link.redirect) {
      window.location.href = link.url;
    }
  };
  return (
    <ul className="dropdown-menu dropdown-menu--sidemenu" role="menu">
      <li className="side-menu-header" onClick={redirect}>
        <span className="sidemenu-item-text">{link.text}</span>
      </li>
      {childrenLinks.map((child, index) => {
        return <DropDownChild child={child} key={`${child.url}-${index}`} />;
      })}
    </ul>
  );
};

export default SideMenuDropDown;
