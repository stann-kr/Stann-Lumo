import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import FormInput from './FormInput';
import FormTextarea from './FormTextarea';
import RadioGroup from './RadioGroup';

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
    expect(input).toHaveAttribute('name', input.getAttribute('id'));

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

  it('uses supplied identifiers and forwards native input semantics', () => {
    render(
      <FormInput
        id="artist-email"
        name="artistEmail"
        label="ARTIST EMAIL"
        type="email"
        value="artist@example.com"
        onChange={() => undefined}
        autoComplete="email"
        required
        aria-invalid="true"
      />,
    );

    const input = screen.getByLabelText('ARTIST EMAIL');
    expect(input).toHaveAttribute('id', 'artist-email');
    expect(input).toHaveAttribute('name', 'artistEmail');
    expect(input).toHaveAttribute('autocomplete', 'email');
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('connects FormTextarea labels and forwards supplied identifiers and semantics', () => {
    render(
      <FormTextarea
        id="profile-description"
        name="profileDescription"
        label="DESCRIPTION"
        value=""
        onChange={() => undefined}
        autoComplete="off"
        disabled
        required
        aria-describedby="description-help"
      />,
    );

    const textarea = screen.getByLabelText('DESCRIPTION');
    expect(textarea).toHaveAttribute('id', 'profile-description');
    expect(textarea).toHaveAttribute('name', 'profileDescription');
    expect(textarea).toHaveAttribute('autocomplete', 'off');
    expect(textarea).toBeDisabled();
    expect(textarea).toBeRequired();
    expect(textarea).toHaveAttribute('aria-describedby', 'description-help');
  });

  it('keeps a native radio group linked by labels, name, and arrow keys', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <RadioGroup
        id="terminal-font-size"
        name="terminalFontSize"
        label="FONT SIZE"
        value="small"
        options={[
          { value: 'small', label: 'SMALL' },
          { value: 'large', label: 'LARGE' },
        ]}
        onChange={onChange}
      />,
    );

    const small = screen.getByLabelText('SMALL');
    const large = screen.getByLabelText('LARGE');
    expect(screen.getByRole('group', { name: 'FONT SIZE' })).toHaveAttribute('id', 'terminal-font-size');
    expect(small).toHaveAttribute('name', 'terminalFontSize');
    expect(small).toHaveAttribute('id', 'terminal-font-size-0');
    expect(small).toBeChecked();

    await user.click(small);
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('large');

    rerender(
      <RadioGroup
        id="terminal-font-size"
        name="terminalFontSize"
        label="FONT SIZE"
        value="large"
        options={[
          { value: 'small', label: 'SMALL' },
          { value: 'large', label: 'LARGE' },
        ]}
        onChange={onChange}
      />,
    );

    expect(large).toBeChecked();
  });
});
