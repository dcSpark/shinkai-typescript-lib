// HTTP Service Interface
export interface IHttpService {
    fetch(url: string, options: any): Promise<Response>;
  }
  
  // Crypto Service Interface
  export interface ICryptoService {
    getRandomValues(buffer: Uint8Array): Uint8Array;
    subtle: {
      exportKey(format: string, key: CryptoKey): Promise<ArrayBuffer>;
      importKey(
        format: string,
        keyData: BufferSource,
        algorithm: string | Algorithm,
        extractable: boolean,
        keyUsages: KeyUsage[]
      ): Promise<CryptoKey>;
      encrypt(
        algorithm: AlgorithmIdentifier,
        key: CryptoKey,
        data: BufferSource
      ): Promise<ArrayBuffer>;
    };
  }