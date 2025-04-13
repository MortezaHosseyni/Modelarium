using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Modelarium.Data.Context;

namespace Modelarium.Data.Repositories
{
    public interface IGenericRepository<TEntity> where TEntity : class
    {
        Task<IEnumerable<TEntity>> GetAllAsync();
        Task<IEnumerable<TEntity>> GetAllIncludeAsync(params Expression<Func<TEntity, object>>[] includes);
        Task<IEnumerable<TEntity>> GetPaginatedAsync(int pageSize, int pageNumber);
        Task<IEnumerable<TEntity>> GetPaginatedIncludeAsync(int pageSize, int pageNumber, params Expression<Func<TEntity, object>>[] includes);
        Task<IEnumerable<TEntity>> GetLimitedAsync(int limit);
        Task<IEnumerable<TEntity>> GetLimitedOrderByAsync(int limit, Expression<Func<TEntity, object>> orderByProperty);
        Task<IEnumerable<TEntity>> FindIncludeAsync(Expression<Func<TEntity, bool>> predicate, params Expression<Func<TEntity, object>>[] includes);
        Task<IEnumerable<TEntity>> FindAsync(Expression<Func<TEntity, bool>> predicate);
        Task<IEnumerable<TEntity>> FindInfinityAsync(Expression<Func<TEntity, bool>> predicate, int skip, int take);
        Task<TEntity?> FindOneAsync(Expression<Func<TEntity?, bool>> predicate);
        Task<TEntity?> FindOneIncludeAsync(Expression<Func<TEntity?, bool>> predicate, params Expression<Func<TEntity, object>>[] includes);
        Task<IEnumerable<TEntity>> FindLimitedIncludeOrderByAsync(int limit, Expression<Func<TEntity, bool>> predicate, Expression<Func<TEntity, object>> orderByProperty, params Expression<Func<TEntity, object>>[] includes);
        Task<bool> AnyAsync();
        Task<bool> AnyAsync(Expression<Func<TEntity, bool>> predicate);
        Task<long> CountAsync();
        Task<long> CountAsync(Expression<Func<TEntity, bool>> predicate);
        Task<decimal> SumAsync(Expression<Func<TEntity, decimal>> selector);
        Task<decimal> SumAsync(Expression<Func<TEntity, bool>> predicate, Expression<Func<TEntity, decimal>> selector);
        void Add(TEntity entity);
        void Add(IEnumerable<TEntity> entities);
        void Update(TEntity entity);
        void Update(IEnumerable<TEntity> entities);
        void Remove(TEntity entity);
        void Remove(IEnumerable<TEntity> entities);
    }

    public class GenericRepository<TEntity>(ModelariumDbContext context) : IGenericRepository<TEntity>
        where TEntity : class
    {
        protected readonly ModelariumDbContext Context = context;

        public async Task<IEnumerable<TEntity>> GetAllAsync()
        {
            return await Context.Set<TEntity>().ToListAsync();
        }

        public async Task<IEnumerable<TEntity>> GetAllIncludeAsync(params Expression<Func<TEntity, object>>[] includes)
        {
            var query = Context.Set<TEntity>().AsNoTracking();

            query = includes.Aggregate(query, (current, include) => current.Include(include));

            return await query.ToListAsync();
        }


        public async Task<IEnumerable<TEntity>> GetPaginatedAsync(int pageSize, int pageNumber)
        {
            var query = Context.Set<TEntity>().AsQueryable();

            var itemsToSkip = (pageNumber - 1) * pageSize;

            var paginatedData = await query.Skip(itemsToSkip)
                                           .Take(pageSize)
                                           .ToListAsync();

            return paginatedData;
        }

        public async Task<IEnumerable<TEntity>> GetPaginatedIncludeAsync(int pageSize, int pageNumber, params Expression<Func<TEntity, object>>[] includes)
        {
            var query = Context.Set<TEntity>().AsQueryable();

            var itemsToSkip = (pageNumber - 1) * pageSize;

            query = includes.Aggregate(query, (current, include) => current.Include(include));

            var paginatedData = await query.Skip(itemsToSkip)
                                           .Take(pageSize)
                                           .ToListAsync();

            return paginatedData;
        }

        public async Task<IEnumerable<TEntity>> GetLimitedAsync(int limit)
        {
            return await Context.Set<TEntity>()
                                 .Take(limit)
                                 .ToListAsync();
        }

        public async Task<IEnumerable<TEntity>> GetLimitedOrderByAsync(int limit, Expression<Func<TEntity, object>> orderByProperty)
        {
            return await Context.Set<TEntity>()
                                 .OrderByDescending(orderByProperty)
                                 .Take(limit)
                                 .ToListAsync();
        }

        public async Task<IEnumerable<TEntity>> FindIncludeAsync(Expression<Func<TEntity, bool>> predicate, params Expression<Func<TEntity, object>>[] includes)
        {
            var query = Context.Set<TEntity>().AsNoTracking().Where(predicate);

            query = includes.Aggregate(query, (current, include) => current.Include(include));

            return await query.ToListAsync();
        }

        public async Task<IEnumerable<TEntity>> FindAsync(Expression<Func<TEntity, bool>> predicate)
        {
            return await Context.Set<TEntity>().AsNoTracking().Where(predicate).ToListAsync();
        }

        public async Task<IEnumerable<TEntity>> FindInfinityAsync(Expression<Func<TEntity, bool>> predicate, int skip, int take)
        {
            return await Context.Set<TEntity>().Skip(skip).Take(take).AsNoTracking().Where(predicate).ToListAsync();
        }

        public async Task<TEntity?> FindOneAsync(Expression<Func<TEntity?, bool>> predicate)
        {
            return await Context.Set<TEntity>().AsNoTracking().Where(predicate).FirstOrDefaultAsync();
        }

        public async Task<TEntity?> FindOneIncludeAsync(Expression<Func<TEntity?, bool>> predicate, params Expression<Func<TEntity, object>>[] includes)
        {
            var query = Context.Set<TEntity>().AsNoTracking().Where(predicate);

            query = includes.Aggregate(query, (current, include) => current.Include(include!));

            return await query.SingleOrDefaultAsync();
        }

        public async Task<IEnumerable<TEntity>> FindLimitedIncludeOrderByAsync(int limit, Expression<Func<TEntity, bool>> predicate, Expression<Func<TEntity, object>> orderByProperty, params Expression<Func<TEntity, object>>[] includes)
        {
            var query = Context.Set<TEntity>()
                                .OrderByDescending(orderByProperty)
                                .Take(limit)
                                .Where(predicate);

            query = includes.Aggregate(query, (current, include) => current.Include(include));

            return await query.ToListAsync();
        }

        public async Task<bool> AnyAsync()
        {
            return await Context.Set<TEntity>().AnyAsync();
        }

        public async Task<bool> AnyAsync(Expression<Func<TEntity, bool>> predicate)
        {
            return await Context.Set<TEntity>().AnyAsync(predicate);
        }

        public async Task<long> CountAsync()
        {
            return await Context.Set<TEntity>().AsNoTracking().CountAsync();
        }

        public async Task<long> CountAsync(Expression<Func<TEntity, bool>> predicate)
        {
            return await Context.Set<TEntity>().AsNoTracking().CountAsync(predicate);
        }

        public async Task<decimal> SumAsync(Expression<Func<TEntity, decimal>> selector)
        {
            return await Context.Set<TEntity>().AsNoTracking().SumAsync(selector);
        }

        public async Task<decimal> SumAsync(Expression<Func<TEntity, bool>> predicate, Expression<Func<TEntity, decimal>> selector)
        {
            return await Context.Set<TEntity>().AsNoTracking().Where(predicate).SumAsync(selector);
        }

        public void Add(TEntity entity)
        {
            Context.Set<TEntity>().Add(entity);
            Context.SaveChanges();

            Context.Entry(entity).State = EntityState.Detached;
        }

        public void Add(IEnumerable<TEntity> entities)
        {
            var enumerable = entities as TEntity[] ?? entities.ToArray();

            Context.Set<TEntity>().AddRange(enumerable);
            Context.SaveChanges();

            foreach (var entity in enumerable.ToList())
            {
                Context.Entry(entity).State = EntityState.Detached;
            }
        }

        public void Update(TEntity entity)
        {
            Context.Set<TEntity>().Update(entity);
            Context.SaveChanges();
        }

        public void Update(IEnumerable<TEntity> entities)
        {
            Context.Set<TEntity>().UpdateRange(entities);
            Context.SaveChanges();
        }

        public void Remove(TEntity entity)
        {
            Context.Set<TEntity>().Remove(entity);
            Context.SaveChanges();
        }

        public void Remove(IEnumerable<TEntity> entities)
        {
            Context.Set<TEntity>().RemoveRange(entities);
            Context.SaveChanges();
        }
    }
}
