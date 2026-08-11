import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import FormSelect from './FormSelect';

describe('FormSelect', () => {
  it('connects its label and defaults name to a stable generated id', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <FormSelect label="STATUS" value="draft" onChange={onChange}>
        <option value="draft">DRAFT</option>
        <option value="published">PUBLISHED</option>
      </FormSelect>,
    );

    const select = screen.getByLabelText('STATUS');
    expect(select).toHaveAttribute('name', select.getAttribute('id'));

    await user.selectOptions(select, 'published');
    expect(onChange).toHaveBeenCalledWith('published');
  });
});
