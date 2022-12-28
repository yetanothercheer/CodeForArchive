import { MeiliSearch } from 'meilisearch'
// const { MeiliSearch } = require('meilisearch')

export function Search() {
    this.client = new MeiliSearch({
        host: 'https://ms-59334f861e41-1292.sgp.meilisearch.io',
        apiKey: '9640ff1d937a38c46909b28adf22055c4adccb9bc6ea8458efcd3a8b440b338e'
    })
}

Search.prototype.search = async function (arg, page = 1) {
    let { hits, limit, offset, totalPages } = await this.client.index('test').search(arg, {
        page
    });
    return { hits, totalPages };
}
