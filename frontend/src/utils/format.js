export const formatPrice = (amount) => `₹${amount.toLocaleString("en-IN")}`;

export const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;
