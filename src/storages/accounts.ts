'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Accounts = {
  privateKeys: string[];
  addPrivateKey: (privateKey: string) => void;
  removePrivateKey: (privateKey: string) => void;
}

export const useAccounts = create<Accounts>()(
  persist(
    (set, get) => ({
          privateKeys: [],
          addPrivateKey: (privateKey) => set(state => ({...state, privateKeys: [...get().privateKeys, privateKey]})),
          removePrivateKey: (privateKey) => set(state => ({...state, privateKeys: get().privateKeys.filter(_privateKey => _privateKey !== privateKey)})),
      }),
    {
  name: 'accounts'
    }
  ));

