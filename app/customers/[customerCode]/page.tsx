import { getCustomerByCode } from "@/app/data/customers";
import { notFound } from "next/navigation";

interface CustomerProps {
    params: CustomerParams;
}

interface CustomerParams {
    customerCode: string;
}

export default function Customer(props: CustomerProps) {
    const customer = getCustomerByCode(props.params.customerCode);

    if (!customer) {
        notFound();
    }

    return (
        <header>
            <h1>{customer.customerName}</h1>
        </header>
    );
}
