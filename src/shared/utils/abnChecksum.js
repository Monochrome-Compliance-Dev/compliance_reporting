export function isValidABN(abn) {
  if (!/^\d{11}$/.test(abn)) return false;

  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const digits = abn.split("").map(Number);

  digits[0] -= 1; // Subtract 1 from the first digit
  const total = digits.reduce(
    (sum, digit, index) => sum + digit * weights[index],
    0
  );

  return total % 89 === 0;
}
