import { Logger } from "../node_modules/winston";
import Koa from "koa";
import Router from "koa-router";

export type HashMap<TType> = { [key: string]: TType };

export interface IThirdPartyLibFactory {
  createServer(): Lib.Koa.IServer;
  createRouter(): Lib.Koa.IRouter;
  createLogger(): Lib.ILogger;
}

export interface IServer {
  listen(): void;
}

export namespace Cache {
  export const TYPES = {
    RIPPLE_DEFAULT_UNL: "ripple.defaultUNL",
    RIPPLE_DAILY_REPORT: "ripple.reports",
    RIPPLE_VALIDATORS: "ripple.validators",
    IPSTACK_GEO: "ipstack.geo",
    MERGED_DATA: "data.merged",
  };
  export interface IDataCache<TCacheType> {
    lastUpdated: Date;
    list: TCacheType[];
  }
  export interface IDefaultUnlResponseCache
    extends IDataCache<Lib.RippleData.DefaultUnlRawResponse> {}
  export interface IDailyReportCache
    extends IDataCache<Lib.RippleData.DailyReportRawResponse> {}
  export interface IValidatorDataCache
    extends IDataCache<Lib.RippleData.ValidatorRawResponse> {}
  export interface IGeoDataCache extends IDataCache<Lib.IPStackResponse> {}
  export type MergedDataCache = {
    pubkey: string,
    domain: string,
    is_ripple: boolean,
    verified: boolean,
    default: boolean,
    is_alt_net: boolean,
    agreement: number,
    disagreement: number,
    total_ledgers: number,
    city: string,
    country_name: string,
    region_name: string,
    latitude: number,
    longitude: number
  };
}

export type ResolveDnsResponse = {
  domain: string;
  ip: string;
};

export interface IProcessEnv extends HashMap<string> {}

export interface IConfiguration {
  getFetchInterval(): number;
  getGeoInfoFetchInterval(): number;
  getDefaultUNLsURL(): string;
  getValidatorsURL(): string;
  getValidatorDailyReportsURL(): string;
  getIPStackFetchURL(): string;
  getIPStackApiKey(): string;
  getPort(): number;
  getAltNetDomainsPattern(): RegExp;
}

export interface IQuerier {
  getDefaultUnl(): Promise<Lib.RippleData.DefaultUnlRawResponse>;
  getValidators(): Promise<Lib.RippleData.ValidatorRawResponse[]>;
  getValidatorDailyReports(): Promise<Lib.RippleData.DailyReportRawResponse[]>;
  getIpFromDomain(domain: string): Promise<ResolveDnsResponse>;
  getGeoInfo(ips: string[]): Promise<Lib.IPStackResponse>;
}

export interface IService {
  getValidatorInfo(): Promise<Cache.IDataCache<Cache.MergedDataCache>>;
  getGeoInfo(): Promise<Cache.IDataCache<Lib.IPStackResponse>>;
}

export interface ICrypto {
  parseDefaultUNLResponse: (
    defaultUNLResponse: Lib.RippleData.DefaultUnlRawResponse
  ) => string[];
}

export namespace Lib {
  export type IPStackResponse = {
    domain?: string;
    ip: string;
    country_name: string;
    region_name: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  export namespace RippleData {
    export type DefaultUnlRawResponse = {
      blob: string;
    };
    export type ValidatorRawResponse = {
      domain: string;
      domain_state: string;
      validation_public_key: string;
    };
    export type Validator = {
      pubkey: string;
      domain: string;
      verified: boolean;
      default: boolean;
    };
    export type DailyReportRawResponse = {
      validation_public_key: string;
      date: string;
      total_ledgers: number;
      main_net_agreement: string;
      main_net_ledgers: number;
      alt_net_agreement: string;
      alt_net_ledgers: number;
      other_ledgers: number;
      domain: string;
      domain_state: string;
      last_datetime: string;
      is_report_available: boolean;
    };
    export type DailyReport = {
      validation_public_key: string;
      date: Date;
      total_ledgers: number;
      main_net_agreement: number;
      main_net_ledgers: number;
      other_ledgers: number;
      domain: string;
      domain_state: string;
      last_datetime: Date;
    };
  }
  export interface ILogger extends Logger {}
  export namespace Koa {
    export interface IServer extends Koa {}
    export interface IRouter extends Router {}
  }
}
