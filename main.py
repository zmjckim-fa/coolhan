"""
CoolHan Main Application
FastAPI application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config import settings
from src.database import init_db
from src.routes.member import router as member_router
from src.routes.order import router as order_router
from src.routes.payment import router as payment_router
from src.routes.inventory import router as inventory_router
from src.routes.shipping import router as shipping_router
from src.routes.notification import router as notification_router
from src.routes.review import router as review_router
from src.routes.shopping import router as shopping_router
from src.routes.gdpr import router as gdpr_router
from src.routes.admin import router as admin_router

# Initialize database
init_db()

# Create FastAPI app
app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description="CoolHan - Specification-Driven Domain Module Implementation"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(member_router)
app.include_router(order_router)
app.include_router(payment_router)
app.include_router(inventory_router)
app.include_router(shipping_router)
app.include_router(notification_router)
app.include_router(review_router)
app.include_router(shopping_router)
app.include_router(gdpr_router)
app.include_router(admin_router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "CoolHan API",
        "version": settings.api_version,
        "status": "running",
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.environment,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
    )
