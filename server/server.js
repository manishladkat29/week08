const express= require('express');
const app= express();
const port=3000;
var mcache = require('memory-cache');
const {check, body ,validationResult} = require('express-validator');
const bodyParser = require('body-parser')
const cors= require('cors');
const swaggerJsdoc= require('swagger-jsdoc');
const swaggerUi= require('swagger-ui-express');

app.use(cors());
const options = {
    swaggerDefinition: {
      info: {
        title: "Company API",
        version: "1.0.0",
        description: "Company API autogenerated by Swagger",
      },
      host: "localhost:3000",
      basePath: "/",
    },
    apis: ["./server.js"],
  };


const specs = swaggerJsdoc(options);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));
app.use(bodyParser.json());
const mariadb= require('mariadb');
const pool= mariadb.createPool({
        host:'localhost',
        user:'root',
        password:'root',
        database:'samples',
        port:3306,
        connectionLimit:5
});

var cache = (duration)=>{
        return(req,res,next)=>{
                let key= '__express__' + req.originalUrl || req.url
                let cachedBody = mcache.get(key)
                if (cachedBody) {
                        console.log("returning from cache");
                        res.header('Content-Type','application/json');
                        res.status(200).send(cachedBody);
                        return;
                }else{
                        res.sendResponse=res.send
                        res.send=(body)=>{
                                mcache.put(key,body,duration*1000);
                                res.header('Content-Type','application/json');
                                res.status(200).sendResponse(body)
                                }
                        next();
                        }
        }
}



/**
 * @swagger
 * /company:
 *    get:
 *      description: Return all records from company table
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Object containing array of company objects
 */
app.get('/company',cache(100),(req,res)=>{
        console.log("/GET company")
        pool.getConnection()
                .then(conn =>{
                        conn.query("SELECT * FROM company")
                                .then((rows)=>{


                                        res.status(200).send(rows);
                                        conn.end();
                                        }).catch(err=>{
                                                console.log(err);
                                                conn.end();
                                        })
                                }).catch(err=>{
                                console.log("not connected");
                                })
});


/**
 * @swagger
 * /agents:
 *    get:
 *      description: Return all records from Agents table
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Object containing array of Agents objects
 */
app.get('/agents', cache(100), (req,res)=>{                             
        console.log("inside agents get");                               
        pool.getConnection()                                            
                .then(conn=>{                                           
                        conn.query("SELECT * from agents")              
                                .then((rows)=>{                         
                                                                        
                                                                        
                                        res.json(rows);                 
                                        conn.end();                     
                                        }).catch(err=>{                 
                                                console.log(err);       
                                                conn.end();             
                                        })                              
                                }).catch(err=>{                         
                                        console.log("Not connected");   
                                });                                     
});                                                                     
                                                                        
																		

/**
 * @swagger
 * /customer:
 *    get:
 *      description: Return all records from customer table
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Object containing array of customer objects
 */																		
app.get('/customer',cache(100),(req,res)=>{
        console.log("GET /customer");
        pool.getConnection()
                .then(conn=>{
                        conn.query("SELECT * from customer")
                                .then((rows)=>{
                                        res.json(rows);
                                        conn.end();
                                        }).catch(err=>{
                                        console.log(err);
                                        conn.end();
                                        })
                                }).catch(err=>{
                                        console.log("Not connected");
                                });
});

/**
 * @swagger
 * definitions:
 *   Company:
 *     properties:
 *       COMPANY_ID:
 *         type: string
 *       COMPANY_NAME:
 *         type: string
 *       COMPANY_CITY:
 *         type: string
 */
/**
 * @swagger
 * /company:
 *    post:
 *      description: add record to company table
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Added data to company table
 *          500:
 *              description: Data already exists
 *          422:
 *              description: Errors in input object
 *      parameters:
 *          - name: Company
 *            description: Company object
 *            in: body
 *            required: true
 *            schema:
 *              $ref: '#/definitions/Company'
 *
 */
app.post('/company', [
    check('COMPANY_ID').isAlphanumeric()
    .withMessage('COMPANY_ID should only be Alphanumeric').isLength({max:6}).withMessage("COMPANY_ID should have maximum 6 numbers"),
    check('COMPANY_NAME').trim().escape().custom(value => /^([a-zA-Z\s])*$/.test(value))
    .withMessage('COMPANY_NAME should only have Alphabets').isLength({max:25}).withMessage("COMPANY_NAME should have maximum 25 characters"),
    check('COMPANY_CITY').trim().escape().custom(value => /^([a-zA-Z\s])*$/.test(value))
    .withMessage('COMPANY_CITY should only have Alphabets').isLength({max:3}).withMessage("COMPANY_CITY should have maximum 3 characters"),
], function (req,res){                                                                                                                      
    console.log("POST /company");      
   var errors= validationResult(req);
    
    if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() })
          
    }
    else{                                                                                                                
                                                                                                                                                            
    pool.getConnection()                                                                                                                                        
        .then(conn=>{                                                                                                                                       
         conn.query("SELECT * from company where COMPANY_ID = ?" , [req.body.COMPANY_ID])                                                                                 
            .then((row)=>{                                                                                                                              
                 if (row.length>0){                                                                                                                  
                     res.status(500).json({status:"Company ID already exists"});                                                                                
                     conn.end();                                                                                                         
                     return;                                                                                                                     
                    }                                                                                                                           
                 console.log("just before insertion");                                                                                               
                 conn.query("INSERT into company value (?, ?,?)", [req.body.COMPANY_ID, req.body.COMPANY_NAME, req.body.COMPANY_CITY])                   
                    .then((rows)=>{                                                                                                             
                        res.status(200).json({status: 'ok'});                                                                               
                        conn.end();                                                                                                         
                        })                                                                                                                  
                    })                                                                                                                          
                }).catch(err=>{                                                                                                                     
                     console.log("Not connected");                                                                                       
                     console.log(err);  
                     conn.end();                                                                                                   
                 });    
                }                                                                                                                     
});  


/**
 * @swagger
 * /company/{id}:
 *    delete:
 *      description: Delete record in Company table
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Successfully deleted record from table
 *          422:
 *              description: Errors in input object
 *      parameters:
 *          - name: id
 *            in: path
 *            required: true
 *            type: string
 *
 */
app.delete('/company/:id', [
    check('id').isAlphanumeric()
    .withMessage('id should only be Alphanumeric').isLength({max:6}).withMessage("Id should have maximum 6 numbers")
],(req,res)=>{
    console.log("inside delete");
    console.log(req.params.id);
    var errors= validationResult(req);
    
    if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() })
          
    }
    else{ 
    pool.getConnection()                                                                                                                                        
        .then(conn=>{                                                                                                                                       
         conn.query("DELETE from company where COMPANY_ID = ?" , [req.params.id])                                                                                 
            .then((row)=>{                                                                                                                              
                if (row.affectedRows==0){
                    res.json({"status":"No record exists for given Id"})
                    conn.end();  
                    return;
                }
                res.json({"status":"Deleted"});
                conn.end();  
            })

            }).catch(err=>{
                console.log(err);
                conn.end();  
            });
        }                                                                                                         
})

/**
 * @swagger
 * /company:
 *    put:
 *      description: add or update a record to Company table
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Added or Updated data to Company table
 *          422:
 *              description: Errors in input object
 *      parameters:
 *          - name: Company
 *            description: Company object
 *            in: body
 *            required: true
 *            schema:
 *              $ref: '#/definitions/Company'
 *
 */
app.put("/company",
[
    check('COMPANY_ID').isAlphanumeric()
    .withMessage('COMPANY ID should only be Alphanumeric').isLength({max:6}).withMessage("COMPANY ID should have maximum 6 numbers"),
    check('COMPANY_NAME').isAlphanumeric()
    .withMessage('COMPANY NAME should only be Alphanumeric').isLength({max:40}).withMessage("COMPANY NAME should have maximum 40 numbers"),
    check('COMPANY_CITY').isAlphanumeric()
    .withMessage('COMPANY CITY should only be Alphanumeric').isLength({max:35}).withMessage("COMPANY CITY should have maximum 35 numbers"),
]
, (req, res) => {
    console.log(req.body);
    pool
      .getConnection()
      .then((conn) => {
        conn.query("SELECT * FROM agents where COMPANY_ID=?",[req.body.COMPANY_ID]).then((row)=>{
          if(row.length==0){
            conn.query("INSERT into company value (?,?,?)", [req.body.COMPANY_ID, req.body.COMPANY_NAME, req.body.COMPANY_CITY])                   
            .then((rows)=>{                                                                                                             
                conn.end();  
                 res.status(200).json({status: 'ok'});                                                                               
                 return;                                                                                                       
                })  
            }                                                                                                                
                                                                                                                                      
            else{
                conn.query("UPDATE company SET COMPANY_NAME=?, COMPANY_CITY=? WHERE COMPANY_ID=?",
            [req.body.COMPANY_NAME, req.body.COMPANY_CITY])
              .then((data) => {
                res.status(200).json({status: 'ok', "data":data});                                                                               
                        
                conn.close();
              })   
              .catch((err) => {
                console.log(err);
                conn.end();
              });
            }
        })
      .catch((err) => {
        console.log(err);
        conn.end();
      });
    });
  });


  /**
 * @swagger
 * /company:
 *    patch:
 *      description: Update record to company table
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Updated data to company table
 *          404:
 *              description: No record for given CompanyId
 *          422:
 *              description: Errors in input object
 *      parameters:
 *          - name: Company
 *            description: company object
 *            in: body
 *            required: true
 *            schema:
 *              $ref: '#/definitions/Company'
 *
 */
app.patch('/company',
[
    check('COMPANY_ID').isAlphanumeric()
    .withMessage('COMPANY_ID should only be Alphanumeric').isLength({max:6}).withMessage("COMPANY ID should have maximum 6 numbers"),
    check('COMPANY_NAME').isAlphanumeric()
    .withMessage('COMPANY NAME should only be Alphanumeric').isLength({max:25}).withMessage("COMPANY NAME should have maximum 25 numbers"),
    check('ITEM_UNIT').isAlphanumeric()
    .withMessage('COMPANY CITY should only be Alphanumeric').isLength({max:5}).withMessage("COMPANY CITY should have maximum 5 numbers"),
],

(req,res)=>{
    pool
      .getConnection()
      .then((conn) => {
        conn.query("SELECT * FROM company where COMPANY_ID=?",[req.body.COMPANY_ID]).then((rows)=>{
            if(rows.length==0){
                conn.close();
                res.status(404).json({"status":"no object found for given company id"});
                return;
            }
            let row=rows[0];
            if (req.body.COMPANY_NAME!=null && row.COMPANY_NAME!=req.body.COMPANY_NAME){
                row.COMPANY_NAME=req.body.COMPANY_NAME;
            }
            if (req.body.COMPANY_CITY!=null && row.COPMANY_CITY!=req.body.COPMANY_CITY){
                row.COMPANY_CITY=req.body.COMPANY_CITY;
            }
           // console.log(row);
            conn.query("UPDATE company SET COMPANY_NAME=? , COPMANY_CITY=? WHERE COMPANY_ID=?",[row.COPMANY_NAME, row.COMPANY_CITY, row.COMPANY_ID])
            .then((data)=>{
                console.log(data);
                if (data.affectedRows>0)
                res.status(200).json({"status":"Updated"});
            })
        }).catch(err=>{
            console.log(err);

        });
    
                
})
});
                                                                                                                                                            
app.get('/',cache(100), (req,res)=>{                                                                                                                        
        console.log("inside get");                                                                                                                          
        var data= {"url3":'http://165.227.201.89:3000/company'};  
        res.json(data);                                                                                                                                     
});                                                                                                                                                         
                                                                                                                                                            
app.listen(port,()=>{                                                                                                                                       
console.log(`Rest app is listening at http://localhost:${port}`);                                                                                           
});
