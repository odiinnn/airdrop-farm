'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PrivateKeyObjectType = {
  data: string;
  isChosen: boolean;
}

type Accounts = {
  privateKeys: PrivateKeyObjectType[];
  addPrivateKey: (privateKey: string) => void;
  removePrivateKey: (privateKey: string) => void;
  setIsChosen: (privateKey: string, isChosen: boolean) => void;
}

/**
 * Private keys storage, created with zoostand.
 * @param {PrivateKeyObjectType} privateKeys - private keys array.
 * @param addPrivateKey - Function to add private key in array.
 *        @param {string} privateKey - private key in string format.
 * @param removePrivateKey - Function to remove private key from array.
 *        @param {string} privateKey - private key in string format.
 * @param setIsChosen - Function to set private key state to chosen/not chosen for swap.
 *        @param {string} privateKey - private key in string format.
 *        @param {boolean} isChosen - chosen state.
 *
 * Persist name option for storage name. By default it is localStorage
 */
export const useAccounts = create<Accounts>()(
  persist(
    (set, get) => ({
          privateKeys: [],
          addPrivateKey: (privateKey) => set(state => ({
            ...state,
            privateKeys: [...get().privateKeys, {data: privateKey, isChosen: false}]
          })),
          removePrivateKey: (privateKey) => set(state => ({
            ...state,
            privateKeys: get().privateKeys.filter(_privateKey => _privateKey.data !== privateKey)
          })),
          setIsChosen : (privateKey, isChosen) => {
            const prK = get().privateKeys.find(_prK => _prK.data === privateKey);
            if (prK) {
              prK.isChosen = isChosen;
            }
            return set(state => ({
              ...state,
            }))
          }
      }),
    {
        name: 'accounts',
        version: 2
    }
  ));

