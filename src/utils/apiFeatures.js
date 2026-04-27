export class ApiFeature {
    constructor(mongooseQuery, queryData) {
      this.mongooseQuery = mongooseQuery; 
      this.queryData = queryData; 
    }
  
    /**
     * Handles pagination
     */
    pagination() {
      let { page, size } = this.queryData;
      if (!page || page <= 0) page = 1; 
      if (!size || size <= 0) size = 10; 
      const skip = (page - 1) * size; 
      this.mongooseQuery.skip(skip).limit(Number(size));
      return this;
    }
  
    /**
     * Handles sorting
     */
    sort() {
      let { sort } = this.queryData;
      if (sort) {
        sort = sort.replaceAll(',', ' '); 
        this.mongooseQuery.sort(sort);
      }
      return this;
    }
  
    /**
     * Handles field selection
     */
    select() {
      let { select } = this.queryData;
      if (select) {
        select = select.replaceAll(',', ' ');
        this.mongooseQuery.select(select);
      }
      return this;
    }
  
    /**
     * Handles filtering
     */
    filter() {
      let { page, size, sort, select, ...filter } = this.queryData; 
      filter = JSON.parse(
        JSON.stringify(filter).replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`)
      );
      this.mongooseQuery.find(filter);
      return this;
    }
  }
   