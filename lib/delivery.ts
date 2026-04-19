export type DeliveryOptionCode =
  | "evri_standard_2_4"
  | "evri_standard_1_2"
  | "royal_mail_standard_2_3"
  | "royal_mail_before_1pm";

export type DeliveryOption = {
  code: DeliveryOptionCode;
  label: string;
  eta: string;
  price: number;
};

export const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    code: "evri_standard_2_4",
    label: "Evri standard service",
    eta: "2-4 days",
    price: 2.89,
  },
  {
    code: "evri_standard_1_2",
    label: "Evri standard service",
    eta: "1-2 days",
    price: 4.99,
  },
  {
    code: "royal_mail_standard_2_3",
    label: "Royal Mail standard delivery",
    eta: "2-3 days",
    price: 2.99,
  },
  {
    code: "royal_mail_before_1pm",
    label: "Royal Mail Before 1pm",
    eta: "Next working day before 1pm",
    price: 8.99,
  },
];

export const DEFAULT_DELIVERY_OPTION: DeliveryOption = DELIVERY_OPTIONS[0];

export function getDeliveryOption(code?: string | null): DeliveryOption {
  if (!code) return DEFAULT_DELIVERY_OPTION;
  return (
    DELIVERY_OPTIONS.find((option) => option.code === code) ||
    DEFAULT_DELIVERY_OPTION
  );
}

export function formatDeliveryLabel(option: DeliveryOption): string {
  return `${option.label} (${option.eta})`;
}
