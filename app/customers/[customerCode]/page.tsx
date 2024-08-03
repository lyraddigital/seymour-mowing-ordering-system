import { notFound } from "next/navigation";

interface CustomerProps {
    params: CustomerParams;
}

interface CustomerParams {
    customerCode: string;
}

export default function Customer(props: CustomerProps) {
    const customer = { customerName: 'Egg' }; //getCustomerByCode(props.params.customerCode);

    if (!customer) {
        notFound();
    }

    return (
        <header>
            <h1>{customer.customerName}</h1>
        </header>
    );
}
