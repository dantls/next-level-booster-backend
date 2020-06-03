import {Request , Response} from 'express';
import knex from '../database/connection';

class PointsController {

  async create (request:Request, response: Response) {
    const {
      name,
      email,
      whatsapp,
      city,
      uf,
      latitude,
      longitude,
      items
    } = request.body;
  
    const trx = await knex.transaction();
  
    const point = {
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=60',
      name,
      email,
      whatsapp,
      city,
      uf,
      latitude,
      longitude
    }

    const insertIds = await trx('points').insert(point);
  
    const point_id = insertIds[0];
  
    const pointItems = items.map((item_id: number) => {
      return {
        item_id,
        point_id,
      }
    });
  
    await trx('point_items').insert(pointItems);

    await trx.commit();
  
    return response.json({
      id: point_id,
      ...point,
    });

  }
  async show (request:Request, response: Response) {
    const { id } = request.params;


    const point = await knex('points').where('id',id).first();

    if(!point) {
      return response.status(400).json({message: 'Point not found.'});
    }

    const items = await knex('items')
      .join('point_items','point_items.item_id' ,'=', 'items.id')
      .where('point_items.point_id', id)
      .select('items.title');

    return response.json({
      point,
      items
    });

  }
  async index (request:Request, response: Response) {
    const { city, uf, items } = request.query;

    const parsedItem = String(items).split(',')
    .map(item => item.trim());

    const points = await knex('points')
      .join('point_items','point_items.point_id','=' ,'points.id')
      .whereIn('point_items.item_id', parsedItem)
      .where('city',String(city))
      .where('uf',String(uf))
      .distinct()
      .select('points.*');
  

    return response.json(points);

  }
}
export default PointsController;