import React from 'react';

import ReactTestRenderer, { act } from 'react-test-renderer';

import { App } from '../src/app/App';

describe('App', () => {
  it('renders correctly', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(<App />);
    });
    expect(renderer!.toJSON()).toBeTruthy();
  });
});
