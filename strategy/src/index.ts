import { Strategy } from "@arweave-wallet-kit/core/strategy";
import type {
    AppInfo,
    DataItem,
    DispatchResult,
    GatewayConfig,
    PermissionType
} from "arconnect";
import Transaction from "arweave/web/lib/transaction";
import type { SignatureOptions } from "arweave/web/lib/crypto/crypto-interface";
import { WAuth, WAuthProviders } from "@wauth/sdk";
import type { ArweaveWalletApi } from "@arweave-wallet-kit/core/wallet";

export default class WAuthStrategy implements Strategy {
    public id: string = "wauth";
    public name = "WAuth";
    public description = "WAuth";
    public theme = "25,25,25";
    public logo = "94R-dRRMdFerUnt8HuQzWT48ktgKsgjQ0uH6zlMFXVw";
    public url = "https://subspace.ar.io"
    private walletRef: WAuth;
    private provider: WAuthProviders;
    private addressListeners: ((address: string) => void)[] = [];

    private authData: any;
    private authDataListeners: ((data: any) => void)[] = [];

    private windowArweaveWalletBackup: any;

    private logos: { [key in WAuthProviders]: string } = {
        [WAuthProviders.Google]: "mc-lqDefUJZdDSOOqepLICrfEoQCACnS51tB3kKqvlk",
        [WAuthProviders.Github]: "2bcLcWjuuRFDqFHlUvgvX2MzA2hOlZL1ED-T8OFBwCY",
        [WAuthProviders.Discord]: "i4Lw4kXr5t57p8E1oOVGMO4vR35TlYsaJ9XYbMMVd8I"
    }

    getWindowWalletInterface() {
        return {
            walletName: "WAuth",
            walletVersion: this.walletRef.version,
            connect: this.connect,
            disconnect: this.disconnect,
            getActiveAddress: this.getActiveAddress,
            getAllAddresses: this.getAllAddresses,
            sign: this.sign,
            getPermissions: this.getPermissions,
            getWalletNames: this.getWalletNames,
            encrypt: this.encrypt,
            decrypt: this.decrypt,
            getArweaveConfig: this.getArweaveConfig,
            isAvailable: this.isAvailable,
            dispatch: this.dispatch,
            signDataItem: this.signDataItem,
            addAddressEvent: this.addAddressEvent,
            removeAddressEvent: this.removeAddressEvent,
            getActivePublicKey: this.getActivePublicKey,
            getConnectedWallets: this.getConnectedWallets,
            removeConnectedWallet: this.removeConnectedWallet
        }
    }


    constructor({ provider }: { provider: WAuthProviders }) {
        this.provider = provider
        this.id = this.id + "-" + this.provider
        this.name = `${this.provider.charAt(0).toUpperCase() + this.provider.slice(1).toLowerCase()}`
        this.walletRef = new WAuth({}) // auto reconnects based on localStorage
        this.authData = this.walletRef.getAuthData();
        this.logo = this.logos[provider]
        this.windowArweaveWalletBackup = null;
    }

    public async connect(permissions?: PermissionType[]): Promise<void> {
        if (permissions) {
            console.warn("WAuth does not support custom permissions")
        }
        const data = await this.walletRef.connect({ provider: this.provider })
        if (data) {
            this.authData = data?.meta
            this.authDataListeners.forEach(listener => listener(data?.meta));
            if (window.arweaveWallet && window.arweaveWallet.walletName != "WAuth") {
                this.windowArweaveWalletBackup = window.arweaveWallet
            }
        }
    }

    public async reconnect(): Promise<any> {
        const data = await this.walletRef.connect({ provider: this.provider })
        if (data) {
            this.authData = data?.meta
            this.authDataListeners.forEach(listener => listener(this.authData));
        }
        return this.authData
    }

    public onAuthDataChange(callback: (data: any) => void): void {
        this.authDataListeners.push(callback);
    }

    public getAuthData(): any {
        return this.walletRef.getAuthData();
    }

    public async addConnectedWallet(ArweaveWallet: any) {
        const address = await ArweaveWallet.getActiveAddress()
        const pkey = await ArweaveWallet.getActivePublicKey()
        if (!address) { throw new Error("No address found") }
        if (!pkey) { throw new Error("No public key found") }

        // wallet must have SIGNATURE permission
        const data = new TextEncoder().encode(JSON.stringify({ address, pkey }));
        const signature = await ArweaveWallet.signMessage(data)
        const signatureString = Buffer.from(signature).toString("base64")
        console.log(signatureString)

        const resData = await this.walletRef.addConnectedWallet(address, pkey, signatureString)
        console.log(resData)
        return resData
    }

    public async removeConnectedWallet(walletId: string) {
        const resData = await this.walletRef.removeConnectedWallet(walletId)
        console.log(resData)
        return resData
    }

    public async disconnect(): Promise<void> {
        this.walletRef.logout()
        this.authData = null;
    }

    public async getActiveAddress(): Promise<string> {
        return await this.walletRef.getActiveAddress();
    }

    public async getAllAddresses(): Promise<string[]> {
        return [await this.getActiveAddress()]
    }

    public async getActivePublicKey(): Promise<string> {
        return await this.walletRef.getActivePublicKey()
    }

    public async getConnectedWallets(): Promise<any[]> {
        return await this.walletRef.getConnectedWallets()
    }

    public async sign(transaction: Transaction, options?: SignatureOptions): Promise<Transaction> {
        throw new Error("Sign is not implemented in WAuth yet")
    }

    public async getPermissions(): Promise<PermissionType[]> {
        return await this.walletRef.getPermissions()
    }

    public async getWalletNames(): Promise<Record<string, string>> {
        return await this.walletRef.getWalletNames()
    }

    public encrypt(
        data: BufferSource,
        options: RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams
    ): Promise<Uint8Array> {
        throw new Error("Encrypt is not implemented in WAuth yet");
    }

    public decrypt(
        data: BufferSource,
        options: RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams
    ): Promise<Uint8Array> {
        throw new Error("Decrypt is not implemented in WAuth yet");
    }

    public async getArweaveConfig(): Promise<GatewayConfig> {
        return await this.walletRef.getArweaveConfig();
    }

    public async isAvailable(): Promise<boolean> {
        return true
    }

    public async dispatch(transaction: Transaction): Promise<DispatchResult> {
        throw new Error("Dispatch is not implemented in WAuth yet")
    }

    public async signDataItem(p: DataItem): Promise<ArrayBuffer> {
        throw new Error("Sign data item is not implemented in WAuth yet")
    }

    public addAddressEvent(listener: (address: string) => void): (e: CustomEvent<{ address: string }>) => void {
        this.addressListeners.push(listener);
        return listener as any;
    }

    public removeAddressEvent(listener: (e: CustomEvent<{ address: string }>) => void): void {
        this.addressListeners.splice(this.addressListeners.indexOf(listener as any), 1);
    }
}

function shouldDisconnect(address: string | undefined, connected: boolean) {
    if (connected && !address && !localStorage.getItem("pocketbase_auth")) {
        return true
    }
    return false
}

function fixConnection(address: string | undefined, connected: boolean, disconnect: () => void) {
    if (shouldDisconnect(address, connected)) { disconnect() }
}

export { WAuthProviders, fixConnection }

