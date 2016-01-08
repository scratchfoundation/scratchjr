#import "ScratchJr.h"
#import <sqlite3.h>


@implementation Database

sqlite3 *db;

NSString* dberror() {return [NSString stringWithFormat:@"SQL error: %s", sqlite3_errmsg(db)];}

+ (void)initTables {
    NSString *stmt =  @"CREATE TABLE IF NOT EXISTS PROJECTS (ID INTEGER PRIMARY KEY AUTOINCREMENT, CTIME DATETIME DEFAULT CURRENT_TIMESTAMP, MTIME DATETIME, ALTMD5 TEXT, POS INTEGER, NAME TEXT, JSON TEXT, THUMBNAIL TEXT, OWNER TEXT, GALLERY TEXT, DELETED TEXT, VERSION TEXT)\n";
    [self exec:stmt];
    NSString *ustmt =  @"CREATE TABLE IF NOT EXISTS USERSHAPES (ID INTEGER PRIMARY KEY AUTOINCREMENT, CTIME DATETIME DEFAULT CURRENT_TIMESTAMP, MD5 TEXT, ALTMD5 TEXT, WIDTH TEXT, HEIGHT TEXT, EXT TEXT, NAME TEXT, OWNER TEXT, SCALE TEXT, VERSION TEXT)\n";
    [self exec:ustmt];
    NSString *bstmt =  @"CREATE TABLE IF NOT EXISTS USERBKGS (ID INTEGER PRIMARY KEY AUTOINCREMENT, CTIME DATETIME DEFAULT CURRENT_TIMESTAMP, MD5 TEXT, ALTMD5 TEXT, WIDTH TEXT, HEIGHT TEXT, EXT TEXT, OWNER TEXT,  VERSION TEXT)\n";
    [self exec:bstmt];
     NSLog(@"init Tables");
}

+ (void) runMigrations {
    // Migrations - TM
    // Add the field to track if a project was a gift - silently fails if the column exists
    NSString *checkStmt = @"ALTER TABLE PROJECTS ADD COLUMN ISGIFT INTEGER DEFAULT 0;\n";
    [self exec:checkStmt];
}

+ (NSString*)open:(NSString *)body {
    NSArray *args = [body componentsSeparatedByString: @"\n"];
    NSString *path = [[NSString alloc] initWithString: [[IO getpath] stringByAppendingPathComponent: [[args objectAtIndex: 0]  stringByAppendingString: @".db"]]];
    NSLog(@"open %@", path);
    const char *cpath = [path UTF8String];
    int ires = sqlite3_open(cpath, &db);
    NSString *res = [NSMutableString stringWithFormat: @"%d", ires];
    [self runMigrations];
    return res;
}

+ (NSString*)close:(NSString *)str {
    int ires = sqlite3_close(db);
    NSString *res = [NSMutableString stringWithFormat: @"%d", ires];
    db = nil;
    return res;
}

+ (NSString*)exec:(NSString *)body {
    NSArray *args = [body componentsSeparatedByString: @"\n"];
    char *errMsg;
  //   NSLog(@"exec %@", [args objectAtIndex: 0]);
    const char *stmt = [[args objectAtIndex: 0] UTF8String];
    NSString *res;
    if (sqlite3_exec(db, stmt, NULL, NULL, &errMsg) == SQLITE_OK) res = @"success";
    else res = [NSString stringWithCString: errMsg encoding:NSUTF8StringEncoding];
    return res;
}

+ (NSString*)stmt:(NSString *)body {
    NSData* data = [body dataUsingEncoding:NSUTF8StringEncoding];
    NSDictionary* dict = [NSJSONSerialization JSONObjectWithData:data options: 0  error: nil];
 //   NSLog(@"stmt %@", dict);
    sqlite3_stmt *stmt;
    NSString *stmtstr = [dict objectForKey: @"stmt"];
    NSArray *values = [dict objectForKey: @"values"];
 //   NSLog(@"stmt %@", stmtstr);
    if (!(sqlite3_prepare_v2(db, [stmtstr UTF8String], -1, &stmt, NULL) == SQLITE_OK)) return dberror();
    for(int i=0;i<[values count];i++)
        sqlite3_bind_text(stmt, i+1, [[values objectAtIndex: i] UTF8String], -1, SQLITE_TRANSIENT);
 //   NSLog(@"stmt done %@", stmtstr);
    if (!(sqlite3_step(stmt) == SQLITE_DONE)) return dberror();
    sqlite3_finalize(stmt);
    return [NSString stringWithFormat:@"%lld",sqlite3_last_insert_rowid(db)];
}

+ (NSArray*)findDataIn:(NSString *)stmtstr with:(NSArray *)values {
    NSMutableArray *res = [[NSMutableArray alloc] init];
    sqlite3_stmt *stmt;
    if (!(sqlite3_prepare_v2(db, [stmtstr UTF8String], -1, &stmt, NULL) == SQLITE_OK)) {
  //       NSLog(@"findDataIn %@", stmtstr);
        [res addObject: dberror()];
        return res;
    }
    for(int i=0;i<[values count];i++)
        sqlite3_bind_text(stmt, i+1, [[values objectAtIndex: i] UTF8String], -1, SQLITE_TRANSIENT);
   
    while(sqlite3_step(stmt) == SQLITE_ROW) [res addObject: [self getRowData: stmt]];
    sqlite3_finalize(stmt);
    return res;
}

+ (NSString*)query:(NSString *)body {
    NSData* data = [body dataUsingEncoding:NSUTF8StringEncoding];
    NSDictionary* dict = [NSJSONSerialization JSONObjectWithData:data options: 0  error: nil];
//    NSLog(@"query %@", dict);
    sqlite3_stmt *stmt;
    NSString *stmtstr = [dict objectForKey: @"stmt"];
    NSArray *values = [dict objectForKey: @"values"];
    
    if (!(sqlite3_prepare_v2(db, [stmtstr UTF8String], -1, &stmt, NULL) == SQLITE_OK)) {
  //      NSLog(@"query %@", stmtstr);
        return dberror();
    }
    for(int i=0;i<[values count];i++)
        sqlite3_bind_text(stmt, i+1, [[values objectAtIndex: i] UTF8String], -1, SQLITE_TRANSIENT);
    NSMutableArray *res = [[NSMutableArray alloc] init];
    while(sqlite3_step(stmt) == SQLITE_ROW) [res addObject: [self getRowData: stmt]];
    sqlite3_finalize(stmt);
    NSData *json =  [NSJSONSerialization dataWithJSONObject: res options: 0  error: nil];
    NSString *jsonstr = [[NSString alloc] initWithData: json encoding:NSUTF8StringEncoding];
    //NSLog(@"%@", jsonstr);
    return jsonstr;
}

+ (NSDictionary*)getRowData:(sqlite3_stmt*)statement {
    NSMutableDictionary *result = [[NSMutableDictionary alloc] init];
    int count = sqlite3_column_count(statement);
    for(int i = 0; i <count; i++) {
        NSString *key  = [[NSString alloc] initWithUTF8String: (const char *) sqlite3_column_name(statement, i)];
        const char *content = (char *)sqlite3_column_text(statement, i);
        if (content) {
            NSString *value  =[[NSString alloc] initWithUTF8String: content];
            [result setObject:value forKey:key];
        }
    }
    return (NSDictionary*) result;
}

@end


