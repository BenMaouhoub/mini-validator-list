import { injectable, inject } from "inversify";
import "reflect-metadata";
import {
  IService,
  IConfiguration,
  ICrypto,
  IQuerier,
  Lib,
  ResolveDnsResponse,
  HashMap,
  Cache
} from "./types";
import { TYPES } from "./inversify.types";
import { isArray } from "util";
import { geoDataMock } from "./geoDataCache";
const { wellKnownValidators } = require("./wellKnownValidators");

type CacheType = Cache.IDataCache<
  | Lib.IPStackResponse
  | Lib.RippleData.ValidatorRawResponse
  | Lib.RippleData.DailyReportRawResponse
  | Lib.RippleData.DefaultUnlRawResponse
  | Cache.MergedDataCache
>;

@injectable()
export default class Service implements IService {
  private _cache: HashMap<CacheType> = {};
  private _rippleDomain = "ripple.com";

  constructor(
    @inject(TYPES.Lib.Logger) protected _logger: Lib.ILogger,
    @inject(TYPES.Configuration) private _configuration: IConfiguration,
    @inject(TYPES.Querier) private _querier: IQuerier,
    @inject(TYPES.Crypto) private _crypto: ICrypto
  ) {
    this._startIntervalFetchAll();
    this._startInitialFetchAll();
  }

  private async _startInitialFetchAll() {
    await Promise.all([
      this._fetchDefaultUnl(),
      this._fetchDailyReport(),
      this._fetchValidators().then(() => {
        return this._withGeoMockData(() =>
          this._fetchGeoInfo(<
            Cache.IDataCache<Lib.RippleData.ValidatorRawResponse>
          >this._cache[Cache.TYPES.RIPPLE_VALIDATORS])
        );
      })
    ]);
    this._mergeIntoValidators();
  }

  private _withGeoMockData(apiCall) {
    if (process.env["NODE_ENV"] === "production") {
      return apiCall();
    } else {
      return new Promise(resolve => {
        this._cache[Cache.TYPES.IPSTACK_GEO] = <Cache.IGeoDataCache>geoDataMock;
        this._logger.info(
          `cache[${Cache.TYPES.IPSTACK_GEO}] has been populated with MOCK data.`
        );
        return resolve(true);
      });
    }
  }

  private _startIntervalFetchAll() {
    const validatorFetchInterval = this._configuration.getFetchInterval();
    setInterval(async () => {
      await Promise.all([
        this._fetchDefaultUnl(),
        this._fetchDailyReport(),
        this._fetchValidators()
      ]);
      this._mergeIntoValidators();
    }, validatorFetchInterval);

    const geoInfoFetchInterval = this._configuration.getGeoInfoFetchInterval();
    setInterval(() => {
      if (this._cache[Cache.TYPES.RIPPLE_VALIDATORS]) {
        this._withGeoMockData(
          this._fetchGeoInfo(<
            Cache.IDataCache<Lib.RippleData.ValidatorRawResponse>
          >this._cache[Cache.TYPES.RIPPLE_VALIDATORS])
        );
      }
    }, geoInfoFetchInterval);
  }

  private async _fetchDefaultUnl() {
    this._logger.info(
      `fetching data for cache[${Cache.TYPES.RIPPLE_DEFAULT_UNL}]...`
    );
    return await this._querier.getDefaultUnl().then(data => {
      this._cache[Cache.TYPES.RIPPLE_DEFAULT_UNL] = {
        lastUpdated: new Date(),
        list: [<Lib.RippleData.DefaultUnlRawResponse>data]
      };
      this._logger.info(
        `cache[${Cache.TYPES.RIPPLE_DEFAULT_UNL}] has been populated.`
      );
    });
  }

  private async _fetchDailyReport() {
    this._logger.info(
      `fetching data for cache[${Cache.TYPES.RIPPLE_DAILY_REPORT}]...`
    );
    return await this._querier.getValidatorDailyReports().then(data => {
      this._cache[Cache.TYPES.RIPPLE_DAILY_REPORT] = {
        lastUpdated: new Date(),
        list: <Lib.RippleData.DailyReportRawResponse[]>data
      };
      this._logger.info(
        `cache[${Cache.TYPES.RIPPLE_DAILY_REPORT}] has been populated.`
      );
    });
  }

  private async _fetchValidators() {
    this._logger.info(
      `fetching data for cache[${Cache.TYPES.RIPPLE_VALIDATORS}]...`
    );
    return await this._querier.getValidators().then(data => {
      this._cache[Cache.TYPES.RIPPLE_VALIDATORS] = {
        lastUpdated: new Date(),
        list: <Lib.RippleData.ValidatorRawResponse[]>data
      };
      this._logger.info(
        `cache[${Cache.TYPES.RIPPLE_VALIDATORS}] has been populated.`
      );
    });
  }

  private async _fetchGeoInfo(
    validatorCache: Cache.IDataCache<Lib.RippleData.ValidatorRawResponse>
  ) {
    this._logger.info(`fetching data for cache[${Cache.TYPES.IPSTACK_GEO}]...`);

    // lookup ip address from the domain
    const capturedDomains = {};
    const promises: Promise<ResolveDnsResponse>[] = validatorCache.list.reduce(
      (prev, v) => {
        if (v.domain && !capturedDomains[v.domain]) {
          prev.push(this._querier.getIpFromDomain(v.domain));
          capturedDomains[v.domain] = true;
        }
        return prev;
      },
      []
    );

    // get domain and address pair
    const domainAndAddressPairs = await Promise.all(promises);

    const list: Lib.IPStackResponse[] = [];
    const ipStackPromises = domainAndAddressPairs.reduce((prev, curr) => {
      if (curr.ip) {
        prev.push(this._querier.getGeoInfo([curr.ip]));
      }
      return prev;
    }, []);

    const geoDataSet: Lib.IPStackResponse[] = await Promise.all(
      ipStackPromises
    );
    domainAndAddressPairs.forEach(domainAndAddressPair => {
      if (domainAndAddressPair.ip) {
        const geoData = geoDataSet.filter(
          g => g.ip === domainAndAddressPair.ip
        )[0];
        list.push({
          domain: domainAndAddressPair.domain,
          ip: domainAndAddressPair.ip,
          country_name: geoData.country_name,
          region_name: geoData.region_name,
          city: geoData.city,
          latitude: geoData.latitude,
          longitude: geoData.longitude
        });
      }
    });

    this._cache[Cache.TYPES.IPSTACK_GEO] = <Cache.IGeoDataCache>{
      lastUpdated: new Date(),
      list: list
    };
    this._logger.info(`cache[${Cache.TYPES.IPSTACK_GEO}] has been populated.`);
  }

  private _first<T>(
    items: T[],
    func: (T) => boolean,
    defaultItem: T = undefined
  ): T {
    const filtered = items.filter(func);
    if (filtered && isArray(filtered) && filtered.length > 0) {
      return filtered[0];
    } else {
      return defaultItem;
    }
  }

  private async _mergeIntoValidators() {
    this._logger.info(`populating cache[${Cache.TYPES.MERGED_DATA}]...`);
    await Promise.all([
      this._waitForCache(Cache.TYPES.RIPPLE_DEFAULT_UNL),
      this._waitForCache(Cache.TYPES.RIPPLE_DAILY_REPORT),
      this._waitForCache(Cache.TYPES.RIPPLE_VALIDATORS),
      this._waitForCache(Cache.TYPES.IPSTACK_GEO)
    ]);

    this._logger.info(`all prerequisites have been populated...`);

    const defaultUnlCache = <Cache.IDefaultUnlResponseCache>(
      this._cache[Cache.TYPES.RIPPLE_DEFAULT_UNL]
    );
    const dailyReports = <Cache.IDailyReportCache>(
      this._cache[Cache.TYPES.RIPPLE_DAILY_REPORT]
    );
    const validators = <Cache.IValidatorDataCache>(
      this._cache[Cache.TYPES.RIPPLE_VALIDATORS]
    );
    const geoInfo = <Cache.IGeoDataCache>this._cache[Cache.TYPES.IPSTACK_GEO];

    const defaultUnl = this._crypto.parseDefaultUNLResponse(
      defaultUnlCache.list[0]
    );
    const altnetRegex = this._configuration.getAltNetDomainsPattern();

    const allValidationPublicKeys = this._union(
      defaultUnl,
      validators.list.map(a => a.validation_public_key)
    );

    const mergedList = allValidationPublicKeys
      .filter(pubkey => pubkey)
      .map(pubkey => {
        let v = this._first(
          validators.list,
          v => v.validation_public_key === pubkey
        );
        if (!v) {
          v = {
            validation_public_key: pubkey,
            domain: undefined,
            domain_state: "unverified"
          };
        }

        // set domain
        const isRipple = v && this._isRippleValidator(v);
        v.domain = isRipple ? this._rippleDomain : v.domain;

        const data = {
          pubkey: v.validation_public_key,
          domain: v.domain,
          is_ripple: isRipple,
          verified: v.domain_state === "verified",
          default: undefined,
          is_report_available: false,
          is_alt_net: false,
          agreement: 0,
          disagreement: 0,
          total_ledgers: 0,
          city: undefined,
          country_name: undefined,
          region_name: undefined,
          latitude: 0,
          longitude: 0
        };

        const defaultUnlItem = this._first<string>(
          defaultUnl,
          pubkey => pubkey === v.validation_public_key
        );
        if (defaultUnlItem) {
          data.default = !!defaultUnlItem;
        }

        // alt-net check 1: check if the alt net pattern matches.
        data.is_alt_net = v.domain && !!altnetRegex.exec(data.domain);

        const reportItem = this._first<Lib.RippleData.DailyReportRawResponse>(
          dailyReports.list,
          report => report.validation_public_key === v.validation_public_key
        );
        if (reportItem) {
          // alt-net check 2: check whether alt-net agreement is greater than the main net.
          // If so, the domain is considered alt-net.
          if (!data.is_alt_net) {
            data.is_alt_net =
              parseFloat(reportItem.alt_net_agreement) >
              parseFloat(reportItem.main_net_agreement);
          }
          data.agreement = !data.is_alt_net
            ? parseFloat(reportItem.main_net_agreement)
            : parseFloat(reportItem.alt_net_agreement);
          let disagreement = 1;
          if (!data.is_alt_net) {
            disagreement =
              reportItem.total_ledgers - reportItem.main_net_ledgers;
            if (reportItem.total_ledgers > 0) {
              disagreement /= reportItem.total_ledgers;
            } else {
              disagreement = 1;
            }
          }
          data.disagreement = parseFloat(disagreement.toFixed(5));
          data.total_ledgers = reportItem.total_ledgers;
          data.is_report_available = true;
        }
        const geoItem = this._first<Lib.IPStackResponse>(
          geoInfo.list,
          geo => geo.domain === v.domain,
          <any>{
            city: undefined,
            country_name: undefined,
            region_name: undefined,
            latitude: undefined,
            longitude: undefined
          }
        );
        if (geoItem) {
          data.city = geoItem.city;
          data.country_name = geoItem.country_name;
          data.region_name = geoItem.region_name;
          data.latitude = geoItem.latitude;
          data.longitude = geoItem.longitude;
        }
        return data;
      });

    this._cache[Cache.TYPES.MERGED_DATA] = <
      Cache.IDataCache<Cache.MergedDataCache>
    >{
      lastUpdated: new Date(),
      list: mergedList
    };
    this._logger.info(`cache[${Cache.TYPES.MERGED_DATA}] has been populated.`);
  }

  private _isRippleValidator(validator: Lib.RippleData.ValidatorRawResponse) {
    const isWellKnown =
      validator.validation_public_key &&
      wellKnownValidators[this._rippleDomain].indexOf(
        validator.validation_public_key
      ) >= 0;
    const endsWith =
      validator.domain &&
      validator.domain.split("/")[0].endsWith(this._rippleDomain);

    return isWellKnown || endsWith;
  }

  private _union(listA: string[], listB: string[]) {
    const dict = {};
    const add = (d, v) => {
      if (!d[v]) {
        d[v] = true;
      }
    };
    listA.forEach(a => add(dict, a));
    listB.forEach(b => add(dict, b));
    return Object.keys(dict);
  }

  private async _waitForCache(name: string, who: string = "") {
    return new Promise<boolean>((resolve, reject) => {
      if (this._cache[name]) {
        return resolve(true);
      }

      // wait until the cache is populated.
      const interval = 1000;
      const timeout = interval * 60;
      let expired = false;
      let elapsed = 0;
      const key = setInterval(() => {
        this._logger.info(
          `${who}: waiting for the cache[${name}] to be populated...`
        );
        if (this._cache[name] || expired) {
          clearInterval(key);

          if (this._cache[name]) {
            this._logger.info(`${who}: cache[${name}] has been populated.`);
            resolve(true);
          } else {
            const message = `${who}: waited long enough for cache[${name}] to be populated. Terminated.`;
            this._logger.warn(message);
            reject(message);
          }
        }
        expired = elapsed > timeout;
        elapsed += interval;
      }, interval);
    });
  }

  async getValidatorInfo(): Promise<Cache.IDataCache<Cache.MergedDataCache>> {
    await this._waitForCache(Cache.TYPES.MERGED_DATA);
    return <Cache.IDataCache<Cache.MergedDataCache>>(
      this._cache[Cache.TYPES.MERGED_DATA]
    );
  }

  async getGeoInfo(): Promise<Cache.IDataCache<Lib.IPStackResponse>> {
    await this._waitForCache(Cache.TYPES.IPSTACK_GEO);
    return <Cache.IDataCache<Lib.IPStackResponse>>(
      this._cache[Cache.TYPES.IPSTACK_GEO]
    );
  }
}
