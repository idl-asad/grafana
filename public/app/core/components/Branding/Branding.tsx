import React, { FC } from 'react';
import { css, cx } from 'emotion';

export interface BrandComponentProps {
  className?: string;
  children?: JSX.Element | JSX.Element[];
}

export const LoginLogo: FC<BrandComponentProps> = ({ className }) => {
  const maxSize = css`
    max-width: 150px;
  `;

  return (
    <>
      <img className={cx(className, maxSize)} src="public/img/cb-logo.png" alt="Grafana" />
    </>
  );
};

export const LoginBackground: FC<BrandComponentProps> = ({ className, children }) => {
  const background = css`
    background: url(public/img/heatmap_bg_test.svg);
    background-size: cover;
  `;

  return <div className={cx(background, className)}>{children}</div>;
};

export const MenuLogo: FC<BrandComponentProps> = ({ className }) => {
  return <img className={className} src="public/img/cb-logo.png" alt="Grafana" />;
};

export const AppTitle = 'Clientbook';

export class Branding {
  static LoginLogo = LoginLogo;
  static LoginBackground = LoginBackground;
  static MenuLogo = MenuLogo;
  static AppTitle = AppTitle;
}
