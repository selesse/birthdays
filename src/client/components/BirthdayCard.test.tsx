import "../../test/setup";
import { describe, expect, mock, test } from "bun:test";
import { Temporal } from "@js-temporal/polyfill";
import { render } from "../../test/testUtils";
import { computeAge } from "../App";
import { BirthdayCard } from "./BirthdayCard";

function makeAge(birthdate: string, todayStr: string) {
  return computeAge(birthdate, Temporal.PlainDate.from(todayStr));
}

describe("BirthdayCard", () => {
  test("renders child name and birthdate", () => {
    const age = makeAge("2020-06-15", "2026-03-27");
    const child = {
      id: "1",
      name: "Alice",
      birthdate: "2020-06-15",
      note: null,
    };
    const { screen } = render(
      <BirthdayCard
        child={child}
        age={age}
        onDelete={mock()}
        onEdit={mock()}
      />,
    );
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Jun 15, 2020")).toBeTruthy();
  });

  test("shows birthday cake emoji on birthday", () => {
    // today is the birthday
    const age = makeAge("2020-03-27", "2026-03-27");
    const child = { id: "1", name: "Bob", birthdate: "2020-03-27", note: null };
    const { container } = render(
      <BirthdayCard
        child={child}
        age={age}
        onDelete={mock()}
        onEdit={mock()}
      />,
    );
    expect(container.textContent).toContain("🎂");
  });

  test("shows age badge in years for older children", () => {
    const age = makeAge("2019-01-15", "2026-03-27");
    const child = {
      id: "1",
      name: "Carol",
      birthdate: "2019-01-15",
      note: null,
    };
    const { screen } = render(
      <BirthdayCard
        child={child}
        age={age}
        onDelete={mock()}
        onEdit={mock()}
      />,
    );
    // 7 years and some months
    expect(screen.getByText("7y 2mo")).toBeTruthy();
  });

  test("shows age badge in months for children under 3", () => {
    const age = makeAge("2024-09-27", "2026-03-27");
    const child = {
      id: "1",
      name: "Dave",
      birthdate: "2024-09-27",
      note: null,
    };
    const { screen } = render(
      <BirthdayCard
        child={child}
        age={age}
        onDelete={mock()}
        onEdit={mock()}
      />,
    );
    expect(screen.getByText("18mo")).toBeTruthy();
  });

  test("shows turning today label on birthday", () => {
    const age = makeAge("2022-03-27", "2026-03-27");
    const child = { id: "1", name: "Eve", birthdate: "2022-03-27", note: null };
    const { screen } = render(
      <BirthdayCard
        child={child}
        age={age}
        onDelete={mock()}
        onEdit={mock()}
      />,
    );
    expect(screen.getByText("Turning 4 today!")).toBeTruthy();
  });

  test("shows turning tomorrow label", () => {
    const age = makeAge("2022-03-28", "2026-03-27");
    const child = {
      id: "1",
      name: "Frank",
      birthdate: "2022-03-28",
      note: null,
    };
    const { screen } = render(
      <BirthdayCard
        child={child}
        age={age}
        onDelete={mock()}
        onEdit={mock()}
      />,
    );
    expect(screen.getByText("Turning 4 tomorrow")).toBeTruthy();
  });

  test("shows Edit and Delete buttons", () => {
    const age = makeAge("2020-06-15", "2026-03-27");
    const child = {
      id: "1",
      name: "Grace",
      birthdate: "2020-06-15",
      note: null,
    };
    const { screen } = render(
      <BirthdayCard
        child={child}
        age={age}
        onDelete={mock()}
        onEdit={mock()}
      />,
    );
    expect(screen.getAllByText("Edit").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Delete").length).toBeGreaterThan(0);
  });
});

describe("computeAge", () => {
  const today = Temporal.PlainDate.from("2026-03-27");

  test("calculates years and months correctly", () => {
    const age = computeAge("2020-01-15", today);
    expect(age.years).toBe(6);
    expect(age.months).toBe(2);
  });

  test("daysUntilNext is 0 on birthday", () => {
    const age = computeAge("2022-03-27", today);
    expect(age.daysUntilNext).toBe(0);
    expect(age.turningAge).toBe(4);
  });

  test("daysUntilNext is 1 the day before birthday", () => {
    const age = computeAge("2022-03-28", today);
    expect(age.daysUntilNext).toBe(1);
  });

  test("wraps to next year for past birthday this year", () => {
    // birthday was Jan 15, today is Mar 27 — next is Jan 15 next year
    const age = computeAge("2020-01-15", today);
    expect(age.nextBirthday).toBe("2027-01-15");
  });

  test("totalDays accumulates correctly", () => {
    const age = computeAge("2026-03-20", today);
    expect(age.totalDays).toBe(7);
  });
});
