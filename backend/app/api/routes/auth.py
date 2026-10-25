from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.all_models import User, AuditLog
from app.schemas.all_schemas import UserCreate, UserLogin, UserResponse, Token, PasswordChangeRequest
from app.core.security import verify_password, get_password_hash, create_access_token
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")

    access_token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role if user_in.role in ["Admin", "Operator", "Viewer"] else "Viewer",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    db.add(AuditLog(
        user_id=new_user.id,
        action="USER_REGISTERED",
        entity_type="User",
        entity_id=str(new_user.id),
        details=f"User {new_user.email} registered with role {new_user.role}"
    ))
    db.commit()

    return new_user

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/change-password")
def change_password(
    req: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(req.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password does not match")
    
    current_user.password_hash = get_password_hash(req.new_password)
    db.commit()

    db.add(AuditLog(
        user_id=current_user.id,
        action="PASSWORD_CHANGED",
        entity_type="User",
        entity_id=str(current_user.id),
        details="User updated their account password"
    ))
    db.commit()

    return {"message": "Password changed successfully"}
