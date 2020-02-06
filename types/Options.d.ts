import {IOp} from 'autobahn'

export default interface Options {
    namespace?: string,
    auto_close_timeout?: number,
    auto_reestablish?: boolean,

    [key: string]: any,
}
