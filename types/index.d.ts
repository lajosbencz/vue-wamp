import Connection from "./Connection";
import Context from "./Context";
import './plugin'

interface Options {
    auto_reestablish?: boolean,
    auto_close_timeout?: number,
    [key: string]: any,
}

export {
    Options,
    Connection,
    Context,
}
