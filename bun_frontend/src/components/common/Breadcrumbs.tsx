import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items?: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items = [] }) => {
    const location = useLocation();

    // Generate default items from path if no items provided
    const pathSegments = location.pathname.split('/').filter(Boolean);

    const generatedItems = items.length > 0 ? items : pathSegments.map((segment, index) => {
        const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
        // Capitalize and format segment
        const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
        return { label, href };
    });

    return (
        <nav className="flex items-center text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
                <li>
                    <Link
                        to="/"
                        className="flex items-center hover:text-white transition-colors"
                        title="Home"
                    >
                        <Home className="w-4 h-4" />
                    </Link>
                </li>

                {generatedItems.map((item, index) => {
                    const isLast = index === generatedItems.length - 1;

                    return (
                        <React.Fragment key={index}>
                            <li>
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                            </li>
                            <li>
                                {isLast || !item.href ? (
                                    <span
                                        className={`font-medium ${isLast ? 'text-white' : 'hover:text-white transition-colors'}`}
                                        aria-current={isLast ? 'page' : undefined}
                                    >
                                        {item.label}
                                    </span>
                                ) : (
                                    <Link
                                        to={item.href}
                                        className="hover:text-white transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                )}
                            </li>
                        </React.Fragment>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
