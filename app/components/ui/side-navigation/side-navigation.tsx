import Image from "next/image";

import CustomerNavIcon from "../icons/customer-nav-icon";
import HomeNavIcon from "../icons/home-nav-icon";
import InvoiceNavIcon from "../icons/invoice-nav-icon";
import SideNavigationLink from "./side-navigation-link";

export default function SideNavigation() {
    return (
        <div className="basis-[240px] grow-0 bg-green-800 flex flex-col gap-6">
            <div className="h-[60px] px-6 py-2 border-b border-b-green-900">
                <Image width="40" height="36" src="/main-logo.png" alt="Seymour Mowing & Maintenance" />
            </div>
            <nav className="px-6">
                <ul>
                    <li>
                        <SideNavigationLink path="/">
                            <HomeNavIcon />
                            <span>Dashboard</span>
                        </SideNavigationLink>
                    </li>
                    <li>
                        <SideNavigationLink path="/customers">
                            <CustomerNavIcon />
                            <span>Customers</span>
                        </SideNavigationLink>
                    </li>
                    <li>
                        <SideNavigationLink path="/invoices">
                            <InvoiceNavIcon />
                            <span>Invoices</span>
                        </SideNavigationLink>
                    </li>
                </ul>
            </nav>
        </div>

    );
}
