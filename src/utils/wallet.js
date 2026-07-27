import Wallet from "../models/Wallet.js";

export const creditWallet = async ({
  userId,
  amount,
  reason,
  referenceId,
  referenceType,
}) => {
  let wallet = await Wallet.findOne({
    userId,
  });

  if (!wallet) {
    wallet = await Wallet.create({
      userId,
      balance: 0,
      transactions: [],
    });
  }

  wallet.balance += amount;

  wallet.transactions.push({
    type: "CREDIT",
    amount,
    reason,
    referenceId,
    referenceType,
  });

  await wallet.save();

  return wallet;
};

export const debitWallet = async ({
  userId,
  amount,
  reason,
  referenceId,
  referenceType,
}) => {
  const wallet = await Wallet.findOne({
    userId,
  });

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  if (wallet.balance < amount) {
    throw new Error("Insufficient wallet balance");
  }

  wallet.balance -= amount;

  wallet.transactions.push({
    type: "DEBIT",
    amount,
    reason,
    referenceId,
    referenceType,
  });

  await wallet.save();

  return wallet;
};
