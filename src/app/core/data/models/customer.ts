type Customer = {
  createdAt: Date;
  updatedAt: Date;
  customerNumber: string;
  customerName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  profilePicUrl?: string;
};

export default Customer;
