'use client';

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";

interface SideNavigationLinkProps extends PropsWithChildren {
    path: string;
}

export default function SideNavigationLink({ children, path }: SideNavigationLinkProps) {
    const currentPath = usePathname();
    const isActiveLink = path === currentPath;
    const linkClasses = clsx(
        "flex gap-3 p-2 block text-green-100 font-bold hover:bg-green-700 rounded mb-1",
        isActiveLink ? "bg-green-700 text-green-50" : undefined
    );

    return (
        <Link href={path} className={linkClasses}>
            {children}
        </Link>
    );
}
