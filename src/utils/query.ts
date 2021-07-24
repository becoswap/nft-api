import { Op } from "sequelize";


const buildQuery = (ctx, filterFields, orderFields) => {
    let limit = ctx.query.limit || 10;
    let query: any = {
        where: {},
        limit: limit,
        offset: ctx.query.offset || 0,
    }
    

    if (ctx.query.ids) {
        query.where.id = {
            [Op.in]: ctx.query.ids.split(","),
        }
    }

    if (ctx.query.orderName && orderFields.includes(ctx.query.orderName)) {
        let orderBy = "desc"
        if (ctx.query.orderBy == "asc") {
            orderBy = "asc";
        }

        query.order = [
            [
                ctx.query.orderName,
                orderBy
            ]
        ] 
    }


    for (var field of filterFields) {
        if (ctx.query[field]) {
            query.where[field] = ctx.query[field];
        }
    }
    return query;
}

export {
    buildQuery
}