export const CAKE_PERSONALIZATION_LIMIT = 1000;

export interface CakePersonalization {
  message: string;
  topperText: string;
  secondLine: string;
  name: string;
  age: string;
  date: string;
  emoji: string;
  font: string;
  textColor: string;
  textPosition: string;
  specialNote: string;
}

export const emptyPersonalization: CakePersonalization = {
  message: "",
  topperText: "",
  secondLine: "",
  name: "",
  age: "",
  date: "",
  emoji: "",
  font: "",
  textColor: "",
  textPosition: "",
  specialNote: "",
};

export function serializePersonalization(fields: CakePersonalization) {
  const details = [
    ["Cake message", fields.message],
    ["Topper text", fields.topperText],
    ["Second line", fields.secondLine],
    ["Name", fields.name],
    ["Age", fields.age],
    ["Date", fields.date],
    ["Emoji", fields.emoji],
    ["Font preference", fields.font],
    ["Text colour", fields.textColor.toUpperCase()],
    ["Text position", fields.textPosition],
    ["Special note", fields.specialNote],
  ] as [string, string][];
  const populatedDetails = details.filter(([, value]) => value.trim());

  return populatedDetails
    .map(([label, value]) => `${label}: ${value.trim()}`)
    .join("\n");
}
