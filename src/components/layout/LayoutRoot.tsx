import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Tabs } from './Tabs';
import { Breadcrumbs } from './Breadcrumbs';
import { getBreadcrumbItems } from './breadcrumbsConfig';
import './layout.css';

type Props = {
  children: ReactNode;
};

export function LayoutRoot({ children }: Props) {
  const { pathname } = useLocation();
  const breadcrumbItems = getBreadcrumbItems(pathname);

  return (
    <div className="app-shell">
      <TopBar />
      <main className="app-layout__main">
        <Breadcrumbs items={breadcrumbItems} />
        {children}
      </main>
      <Tabs variant="bottom" />
    </div>
  );
}
