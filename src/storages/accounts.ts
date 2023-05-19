'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Accounts = {
  privateKeys: string[];
  addPrivateKey: (privateKey: string) => void;
  removePrivateKey: (privateKey: string) => void;
}

/**
 * Private keys storage, created with zoostand.
 * @param {Accounts} privateKeys - private keys array.
 * @param addPrivateKey - Function to add private key in array.
 *        @param {string} privateKey - private key in string format.
 * @param removePrivateKey - Function to remove private key from array.
 *        @param {string} privateKey - private key in string format.
 *
 * Persist name option for storage name. By default it is localStorage
 */
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

