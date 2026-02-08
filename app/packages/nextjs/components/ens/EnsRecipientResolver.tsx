"use client";

import { useState } from "react";
import Image from "next/image";
import { normalize } from "viem/ens";
import { useEnsAddress, useEnsAvatar, useEnsName, useEnsText } from "wagmi";
import { mainnet } from "wagmi/chains";

type EnsRecipientResolverProps = {
  onAddRecipient: (address: `0x${string}`) => void;
  connectedAddress?: `0x${string}`;
};

export const EnsRecipientResolver = ({ onAddRecipient, connectedAddress }: EnsRecipientResolverProps) => {
  const [ensInput, setEnsInput] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState<`0x${string}` | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reverse lookup for connected wallet
  const { data: connectedEnsName } = useEnsName({
    address: connectedAddress,
    chainId: mainnet.id,
  });

  // ENS resolution hooks (only active when we have a valid ENS name)
  let normalizedName: string | undefined;
  try {
    // Only normalize if input looks like a complete ENS name
    if (ensInput.trim() && ensInput.includes(".") && !ensInput.endsWith(".")) {
      normalizedName = normalize(ensInput);
    }
  } catch (e) {
    // Invalid ENS name during typing - silently ignore
    normalizedName = undefined;
  }

  const { data: ensAddress, isLoading: isLoadingAddress } = useEnsAddress({
    name: normalizedName,
    chainId: mainnet.id,
  });

  const { data: ensAvatar } = useEnsAvatar({
    name: normalizedName,
    chainId: mainnet.id,
  });

  const { data: ensEmail } = useEnsText({
    name: normalizedName,
    key: "email",
    chainId: mainnet.id,
  });

  const { data: ensUrl } = useEnsText({
    name: normalizedName,
    key: "url",
    chainId: mainnet.id,
  });

  const { data: ensPreferredToken } = useEnsText({
    name: normalizedName,
    key: "payment:preferred_token",
    chainId: mainnet.id,
  });

  const handleResolveEns = async () => {
    setError(null);
    setResolvedAddress(null);

    if (!ensInput.trim()) {
      setError("Please enter an ENS name");
      return;
    }

    if (!ensInput.includes(".")) {
      setError("Please enter a valid ENS name (e.g., vitalik.eth)");
      return;
    }

    setIsResolving(true);

    // Wait for the hook to resolve
    setTimeout(() => {
      if (ensAddress) {
        setResolvedAddress(ensAddress);
        setError(null);
      } else {
        setError("ENS name not found or invalid");
      }
      setIsResolving(false);
    }, 1000);
  };

  const handleAddToRecipients = () => {
    if (resolvedAddress) {
      onAddRecipient(resolvedAddress);
      // Clear the form
      setEnsInput("");
      setResolvedAddress(null);
      setError(null);
    }
  };

  const handleUseConnectedEns = () => {
    if (connectedEnsName) {
      setEnsInput(connectedEnsName);
    }
  };

  return (
    <div className="p-8 border-2 border-orange-500/30 rounded-lg bg-orange-500/5 mb-8">
      <h3 className="text-3xl font-bold mb-6 text-orange-500">ENS_RECIPIENT_RESOLVER</h3>

      {/* Connected ENS Helper */}
      {connectedAddress && connectedEnsName && (
        <div className="mb-6 p-4 bg-black border border-gray-700 rounded">
          <p className="text-gray-400 text-sm mb-2">Connected ENS:</p>
          <div className="flex items-center gap-3">
            <span className="text-white text-lg font-mono">{connectedEnsName}</span>
            <button
              onClick={handleUseConnectedEns}
              className="btn btn-sm bg-orange-500 hover:bg-orange-600 border-none text-white"
            >
              Use this ENS
            </button>
          </div>
        </div>
      )}

      {/* ENS Input */}
      <div className="mb-6">
        <label className="label">
          <span className="label-text text-gray-400 text-lg">ENS Name</span>
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="sentinelvault.eth"
            className="input input-bordered bg-black border-gray-700 text-white text-lg flex-1"
            value={ensInput}
            onChange={e => setEnsInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleResolveEns()}
          />
          <button
            onClick={handleResolveEns}
            disabled={isResolving || isLoadingAddress}
            className="btn bg-orange-500 hover:bg-orange-600 border-none text-white text-lg px-8"
          >
            {isResolving || isLoadingAddress ? "Resolving..." : "Resolve ENS"}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="alert alert-error mb-6 bg-red-900/20 border-red-500 text-red-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Resolved ENS Data */}
      {resolvedAddress && (
        <div className="bg-black border-2 border-green-500 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            {/* Avatar - wrapped in error boundary to handle CORS issues */}
            {ensAvatar && (
              <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-gray-800">
                <Image 
                  src={ensAvatar} 
                  alt="ENS Avatar" 
                  fill 
                  className="object-cover"
                  unoptimized
                  onError={(e) => {
                    // Hide image on CORS or loading errors
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className="flex-1">
              {/* Resolved Address */}
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-1">Resolved Address:</p>
                <p className="text-white font-mono text-lg break-all">{resolvedAddress}</p>
              </div>

              {/* ENS Text Records */}
              {(ensEmail || ensUrl || ensPreferredToken) && (
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-bold mb-2">ENS Metadata:</p>

                  {ensEmail && (
                    <div className="flex gap-2">
                      <span className="text-orange-500 font-mono">email:</span>
                      <span className="text-white">{ensEmail}</span>
                    </div>
                  )}

                  {ensUrl && (
                    <div className="flex gap-2">
                      <span className="text-orange-500 font-mono">url:</span>
                      <a
                        href={ensUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        {ensUrl}
                      </a>
                    </div>
                  )}

                  {ensPreferredToken && (
                    <div className="flex gap-2">
                      <span className="text-orange-500 font-mono">payment:preferred_token:</span>
                      <span className="text-white">{ensPreferredToken}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Add to Recipients Button */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <button
              onClick={handleAddToRecipients}
              className="btn bg-green-500 hover:bg-green-600 border-none text-white text-lg px-8 w-full"
            >
              Add to Recipients
            </button>
          </div>
        </div>
      )}

      {/* Info Text */}
      <p className="text-gray-500 text-sm italic mt-4">
        💡 ENS names are resolved from Ethereum Mainnet to provide human-readable payment identities with portable
        metadata.
      </p>
    </div>
  );
};
