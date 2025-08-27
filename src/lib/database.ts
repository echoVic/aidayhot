import { supabase } from './supabase';

// 通用数据库服务类
class DatabaseService {
  // 通用查询方法
  static async query(tableName: string, options: {
    select?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
  } = {}) {
    let query = supabase.from(tableName).select(options.select || '*');

    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    if (options.orderBy) {
      query = query.order(options.orderBy.column, { 
        ascending: options.orderBy.ascending ?? false 
      });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`查询 ${tableName} 失败:`, error);
      throw error;
    }

    return data || [];
  }

  // 通用插入方法
  static async insert(tableName: string, data: any) {
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error(`插入 ${tableName} 失败:`, error);
      throw error;
    }

    return result;
  }

  // 通用更新方法
  static async update(tableName: string, id: string, data: any) {
    const { data: result, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`更新 ${tableName} 失败:`, error);
      throw error;
    }

    return result;
  }

  // 通用删除方法
  static async delete(tableName: string, id: string) {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`删除 ${tableName} 失败:`, error);
      throw error;
    }

    return true;
  }
}



// 导出主要服务
export { DatabaseService as default };
