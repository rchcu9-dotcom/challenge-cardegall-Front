import { Link } from 'react-router-dom';
import type { BreadcrumbItem } from './breadcrumbsConfig';

type Props = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: Props) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="app-breadcrumbs" aria-label="Fil d'Ariane">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="app-breadcrumbs__item">
            {item.path && !isLast ? (
              <Link to={item.path} className="app-breadcrumbs__link">
                {item.label}
              </Link>
            ) : (
              <span className="app-breadcrumbs__current">{item.label}</span>
            )}
            {!isLast && (
              <span className="app-breadcrumbs__separator" aria-hidden="true">
                ›
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
