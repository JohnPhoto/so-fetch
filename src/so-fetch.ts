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
  ): Promise<IRequestInterceptorConfig> {
    return this.requestInterceptors.reduce(
      (promise, interceptor) =>
        promise.then((opts: IRequestInterceptorConfig) => interceptor(opts)),
      Promise.resolve({ ...options }),
    )
  }

  public applyResponseInterceptors(
    response: SoFetchResponse<T>,
    config: IFetchOptions,
  ): Promise<SoFetchResponse<T>> {
    // chuck the config onto the response so we can get at it later
    response.config = config
    return this.responseInterceptors.reduce(
      (promise, interceptor) =>
        promise.then((newResp: SoFetchResponse<T>) => interceptor(newResp)),
      Promise.resolve(response),
    )
  }

  public fetch(
    options: string | IFetchOptions & { url: string },
  ): Promise<SoFetchResponse<T>>
  public fetch(url: string, options: IFetchOptions): Promise<SoFetchResponse<T>>

  public fetch(
    url: string | (IFetchOptions & { url: string }),
    options: IFetchOptions = {},
  ): Promise<SoFetchResponse<T>> {
    if (typeof url !== 'string') {
      options = url
      url = url.url
    }
    const fullUrl = this.rootUrl() + url
    const headers = new Headers(options.headers || {})

    return this.applyRequestInterceptors({
      method: 'GET',
      ...options,
      headers,
      url: fullUrl,
    })
      .then(finalOpts =>
        fetch(fullUrl, finalOpts as RequestInit)
          .then(resp => parseResponse<T>(resp))
          .then(resp => this.applyResponseInterceptors(resp, finalOpts)),
      )
      .then(resp => {
        if (resp.isError) {
          throw resp
        } else {
          return resp
        }
      })
  }

  public get(url: string, options: IFetchOptions = {}) {
    return this.fetch(url, options)
  }

  public post(
    url: string,
    postBody?: {},
    options?: IFetchOptions,
  ): Promise<SoFetchResponse<T>> {
    const headers = new Headers((options && options.headers) || {})
    if (postBody) {
      headers.set('Content-Type', 'application/json')
    }

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
    if (postBody) {
      headers.set('Content-Type', 'application/json')
    }

    return this.fetch(url, {
      ...options,
      method: 'PUT',
      body: postBody ? JSON.stringify(postBody) : undefined,
      headers,
    })
  }

  public patch(
    url: string,
    postBody?: {},
    options?: IFetchOptions,
  ): Promise<SoFetchResponse<T>> {
    const headers = new Headers((options && options.headers) || {})
    if (postBody) {
      headers.set('Content-Type', 'application/json')
    }

    return this.fetch(url, {
      ...options,
      method: 'PATCH',
      body: postBody ? JSON.stringify(postBody) : undefined,
      headers,
    })
  }

  public del(
    url: string,
    postBody?: {},
    options?: IFetchOptions,
  ): Promise<SoFetchResponse<T>> {
    const headers = new Headers((options && options.headers) || {})
    if (postBody) {
      headers.set('Content-Type', 'application/json')
    }

    return this.fetch(url, {
      ...options,
      method: 'DELETE',
      body: postBody ? JSON.stringify(postBody) : undefined,
      headers,
    })
  }
}

export default SoFetch
