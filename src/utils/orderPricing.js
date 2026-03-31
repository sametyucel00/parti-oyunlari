const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

export const createOrderItemDraft = (overrides = {}) => ({
    productId: '',
    quantity: 1,
    price: 0,
    depositFee: 0,
    includeDeposit: false,
    name: '',
    ...overrides,
});

export const hydrateOrderItemWithProduct = (product, overrides = {}) => {
    if (!product) {
        return createOrderItemDraft(overrides);
    }

    return createOrderItemDraft({
        productId: product.id,
        name: product.name || '',
        price: toNumber(product.price),
        depositFee: toNumber(product.depositFee),
        includeDeposit: Boolean(overrides.includeDeposit),
        ...overrides,
    });
};

export const getItemTotals = (item) => {
    const quantity = Math.max(0, toNumber(item?.quantity || 0));
    const price = toNumber(item?.price || 0);
    const depositFee = toNumber(item?.depositFee || 0);
    const includeDeposit = Boolean(item?.includeDeposit);
    const productTotal = price * quantity;
    const depositTotal = includeDeposit ? depositFee * quantity : 0;

    return {
        quantity,
        price,
        depositFee,
        includeDeposit,
        productTotal,
        depositTotal,
        total: productTotal + depositTotal,
    };
};

export const calculateOrderTotals = (items = []) => {
    return items.reduce(
        (totals, item) => {
            const current = getItemTotals(item);
            totals.quantity += current.quantity;
            totals.productTotal += current.productTotal;
            totals.depositTotal += current.depositTotal;
            totals.amount += current.total;
            return totals;
        },
        { quantity: 0, productTotal: 0, depositTotal: 0, amount: 0 }
    );
};

