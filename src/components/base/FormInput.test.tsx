import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import FormInput from './FormInput';

describe('FormInput', () => {
  it('connects its visible label and forwards password autocomplete semantics', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <FormInput
        label="RA API KEY"
        type="password"
        value=""
        onChange={onChange}
        autoComplete="new-password"
      />,
    );

    const input = screen.getByLabelText('RA API KEY');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('autocomplete', 'new-password');

    await user.type(input, 'replacement');
    expect(onChange).toHaveBeenCalled();
  });

  it('forwards disabled and described-by state', () => {
    render(
      <FormInput
        id="config-key"
        label="CONFIG KEY"
        value=""
        onChange={() => undefined}
        disabled
        aria-describedby="config-key-help"
      />,
    );

    const input = screen.getByLabelText('CONFIG KEY');
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('id', 'config-key');
    expect(input).toHaveAttribute('aria-describedby', 'config-key-help');
  });
});
