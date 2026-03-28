import "../../test/setup";
import { describe, expect, mock, test } from "bun:test";
import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../../test/testUtils";
import { AddBirthday } from "./AddBirthday";

describe("AddBirthday", () => {
  test("renders default title and submit button", () => {
    const { screen } = render(<AddBirthday onAdd={mock()} />);
    expect(screen.getByText("Add a Birthday")).toBeTruthy();
    expect(screen.getByText("Add Birthday")).toBeTruthy();
  });

  test("renders edit title when submitLabel is Save Changes", () => {
    const { screen } = render(
      <AddBirthday onAdd={mock()} submitLabel="Save Changes" />,
    );
    expect(screen.getByText("Edit Birthday")).toBeTruthy();
    expect(screen.getByText("Save Changes")).toBeTruthy();
  });

  test("shows Cancel button when onCancel is provided", () => {
    const { screen } = render(<AddBirthday onAdd={mock()} onCancel={mock()} />);
    expect(screen.getByText("Cancel")).toBeTruthy();
  });

  test("does not show Cancel button when onCancel is omitted", () => {
    const { screen } = render(<AddBirthday onAdd={mock()} />);
    expect(screen.queryByText("Cancel")).toBeNull();
  });

  test("calls onCancel when Cancel is clicked", () => {
    const onCancel = mock();
    const { screen } = render(
      <AddBirthday onAdd={mock()} onCancel={onCancel} />,
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test("shows error when submitted with empty name", () => {
    const { screen } = render(<AddBirthday onAdd={mock()} />);
    fireEvent.click(screen.getByText("Add Birthday"));
    expect(screen.getByText("Name is required")).toBeTruthy();
  });

  test("shows error when submitted without birthdate", async () => {
    const user = userEvent.setup();
    const { screen, container } = render(<AddBirthday onAdd={mock()} />);
    const nameInput = container.querySelector(
      "input[type=text]",
    ) as HTMLInputElement;
    await user.type(nameInput, "Alice");
    await user.click(screen.getByText("Add Birthday"));
    expect(screen.getByText("Birthdate is required")).toBeTruthy();
  });

  test("calls onAdd with name, birthdate, and note when form is valid", async () => {
    const user = userEvent.setup();
    const onAdd = mock();
    const { screen, container } = render(<AddBirthday onAdd={onAdd} />);

    const [nameInput, noteInput] =
      container.querySelectorAll("input[type=text]");
    const dateInput = container.querySelector(
      "input[type=date]",
    ) as HTMLInputElement;

    await user.type(nameInput as HTMLInputElement, "Alice");
    await user.type(dateInput, "2020-06-15");
    await user.type(noteInput as HTMLInputElement, "my niece");
    await user.click(screen.getByText("Add Birthday"));

    expect(onAdd).toHaveBeenCalledWith("Alice", "2020-06-15", "my niece");
  });

  test("calls onAdd without note when note is blank", async () => {
    const user = userEvent.setup();
    const onAdd = mock();
    const { screen, container } = render(<AddBirthday onAdd={onAdd} />);

    const nameInput = container.querySelector(
      "input[type=text]",
    ) as HTMLInputElement;
    const dateInput = container.querySelector(
      "input[type=date]",
    ) as HTMLInputElement;

    await user.type(nameInput, "Bob");
    await user.type(dateInput, "2021-03-01");
    await user.click(screen.getByText("Add Birthday"));

    expect(onAdd).toHaveBeenCalledWith("Bob", "2021-03-01", undefined);
  });

  test("pre-fills fields from initial prop", () => {
    const { container } = render(
      <AddBirthday
        onAdd={mock()}
        initial={{ name: "Eve", birthdate: "2019-09-09", note: "old note" }}
        submitLabel="Save Changes"
      />,
    );

    const nameInput = container.querySelector(
      "input[type=text]",
    ) as HTMLInputElement;
    const dateInput = container.querySelector(
      "input[type=date]",
    ) as HTMLInputElement;

    expect(nameInput.value).toBe("Eve");
    expect(dateInput.value).toBe("2019-09-09");
  });
});
