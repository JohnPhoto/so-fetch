import {
  IFetchOptions,
  IRequestInterceptorConfig,
  ISoFetchInitialisation,
  RequestInterceptor,
  ResponseInterceptor,
} from './interfaces'
import parseResponse from './parse-response'
import SoFetchResponse from './response'

class SoFetch<T> {
  private requestInterceptors: RequestInterceptor[]
  private responseInterceptors: Array<ResponseInterceptor<T>>
  private rootUrl: () => string

  constructor({
    requestInterceptors = [],
    responseInterceptors = [],
    rootUrl = () => '',
  }: ISoFetchInitialisation<T> = {}) {
    this.requestInterceptors = requestInterceptors
    this.responseInterceptors = responseInterceptors
    this.rootUrl = rootUrl
  }

  public applyRequestInterceptors(
    options: IRequestInterceptorConfig,
  ): IRequestInterceptorConfig {
    return this.requestInterceptors.reduce(
      (opts, interceptor) => {
        return interceptor(options)
      },
      { ...options },
    )
  }

  public applyResponseInterceptors(
    response: SoFetchResponse<T>,
    config: IFetchOptions,
  ): SoFetchResponse<T> {
    // chuck the config onto the response so we can get at it later
    response.config = config
    return this.responseInterceptors.reduce((newResp, interceptor) => {
      return interceptor(newResp)
    }, response)
  }

  public fetch(
    url: string,
    options: IFetchOptions = {},
  ): Promise<SoFetchResponse<T>> {
    const fullUrl = this.rootUrl() + url
    const headers = new Headers(options.headers || {})

    const finalOpts = this.applyRequestInterceptors({
      method: 'GET',
      ...options,
      headers,
      url: fullUrl,
    })
    return fetch(fullUrl, finalOpts as RequestInit)
      .then(resp => parseResponse<T>(resp))
      .then(resp => this.applyResponseInterceptors(resp, finalOpts))
      .then(resp => {
        if (resp.isError) {
          throw resp
        } else {
          return resp
        }
      })
  }

  public post(
    url: string,
    postBody?: {},
    options?: IFetchOptions,
  ): Promise<SoFetchResponse<T>> {
    const headers = new Headers((options && options.headers) || {})
    headers.set('Content-Type', 'application/json')

    return this.fetch(url, {
      method: 'POST',
      ...options,
      headers,
      body: postBody ? JSON.stringify(postBody) : undefined,
    })
  }

  public put(
    url: string,
    postBody?: {},
    options?: IFetchOptions,
  ): Promise<SoFetchResponse<T>> {
    const headers = new Headers((options && options.headers) || {})
    headers.set('Content-Type', 'application/json')

    return this.fetch(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(postBody),
      headers,
    })
  }
}

export default SoFetch
