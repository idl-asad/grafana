import React, { FC } from 'react';

export interface Props {
  child: any;
}

const DropDownChild: FC<Props> = props => {
  const { child } = props;
  const listItemClassName = child.divider ? 'divider' : '';
  const redirect = () => {
    if (child.redirect) {
      window.location.href = child.url;
    }
  };
  return (
    <li className={listItemClassName} onClick={redirect}>
      <a href={!child.redirect ? child.url : ''}>
        {child.icon && <i className={child.icon} />}
        {child.text}
      </a>
    </li>
  );
};

export default DropDownChild;
