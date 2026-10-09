import assert from "node:assert/strict";
import test from "node:test";

import {
  emptyPersonalization,
  serializePersonalization,
} from "./cake-personalization";

test("serializes cake personalization as labeled, readable order notes", () => {
  assert.equal(
    serializePersonalization({
      ...emptyPersonalization,
      message: "Happy birthday!",
      topperText: "Best day",
      name: "Alex",
      age: "7",
      date: "2026-10-09",
      emoji: "🎂",
      font: "Playful",
      textColor: "#ff00aa",
      textPosition: "Front centre",
      specialNote: "Please call to confirm.",
    }),
    [
      "Cake message: Happy birthday!",
      "Topper text: Best day",
      "Name: Alex",
      "Age: 7",
      "Date: 2026-10-09",
      "Emoji: 🎂",
      "Font preference: Playful",
      "Text colour: #FF00AA",
      "Text position: Front centre",
      "Special note: Please call to confirm.",
    ].join("\n")
  );
});

test("omits blank fields and trims customer-entered values", () => {
  assert.equal(
    serializePersonalization({
      ...emptyPersonalization,
      message: "  Hello  ",
      textColor: "",
    }),
    "Cake message: Hello"
  );
});
