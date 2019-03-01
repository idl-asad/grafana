import React, { FC } from 'react';
import DropDownChild from './DropDownChild';

interface Props {
  link: any;
}

const SideMenuDropDown: FC<Props> = props => {
  const { link } = props;
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
      {link.children &&
        link.children.map((child, index) => {
          return <DropDownChild child={child} key={`${child.url}-${index}`} />;
        })}
    </ul>
  );
};

export default SideMenuDropDown;
