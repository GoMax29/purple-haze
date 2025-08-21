import { getVariantForEveningSlot } from "../dayNight";

describe("getVariantForEveningSlot", () => {
    const cases: Array<[string, "day" | "night"]> = [
        ["2025-08-18T20:30", "night"],
        ["2025-08-18T20:59", "night"],
        ["2025-08-18T21:00", "day"],
        ["2025-08-18T21:01", "day"],
        ["2025-08-18T21:27", "day"],
    ];

    cases.forEach(([iso, expected]) => {
        it(`${iso} -> ${expected}`, () => {
            expect(getVariantForEveningSlot(iso)).toBe(expected);
        });
    });
});







