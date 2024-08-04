import Image from "next/image";

import CustomerNavIcon from "../icons/customer-nav-icon";
import HomeNavIcon from "../icons/home-nav-icon";
import InvoiceNavIcon from "../icons/invoice-nav-icon";
import SideNavigationLink from "./side-navigation-link";

export default function SideNavigation() {
    return (
        <div className="px-6 basis-[240px] grow-0 bg-green-300 flex flex-col gap-6">
            <div className="h-[64px] py-2">
                <Image width="44" height="36" src="/main-logo.png" alt="Seymour Mowing & Maintenance" />
            </div>
            <nav>
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
