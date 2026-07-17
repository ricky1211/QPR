"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NcrsModule = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const ncrs_service_1 = require("./ncrs.service");
const ncrs_controller_1 = require("./ncrs.controller");
const prisma_module_1 = require("../../infrastructure/prisma/prisma.module");
const minio_module_1 = require("../../infrastructure/minio/minio.module");
let NcrsModule = class NcrsModule {
};
exports.NcrsModule = NcrsModule;
exports.NcrsModule = NcrsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            minio_module_1.MinioModule,
            platform_express_1.MulterModule.register({
                limits: {
                    fileSize: 5 * 1024 * 1024,
                },
            }),
        ],
        controllers: [ncrs_controller_1.NcrsController],
        providers: [ncrs_service_1.NcrsService],
        exports: [ncrs_service_1.NcrsService],
    })
], NcrsModule);
//# sourceMappingURL=ncrs.module.js.map