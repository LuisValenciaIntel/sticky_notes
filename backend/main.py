import json
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

SECRET_KEY = "change-me-in-production-super-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8 hours

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "db.json")

# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ---------------------------------------------------------------------------
# JSON persistence helpers
# ---------------------------------------------------------------------------

def _load_db() -> dict:
    if not os.path.exists(DB_PATH):
        _bootstrap_db()
    with open(DB_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_db(data: dict) -> None:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def _bootstrap_db() -> None:
    """Create the database file and seed the initial test user."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    initial = {
        "users": [
            {
                "id": str(uuid.uuid4()),
                "username": "test",
                "password_hash": hash_password("test123"),
                "must_change_password": True,
            }
        ],
        "notes": [],
    }
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(initial, f, indent=2, ensure_ascii=False)


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class Token(BaseModel):
    access_token: str
    token_type: str
    must_change_password: bool


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class NoteCreate(BaseModel):
    title: str
    content: str
    color: Optional[str] = "#fff7a8"


class NoteOut(BaseModel):
    id: str
    user_id: str
    title: str
    content: str
    color: str
    created_at: str


class UserOut(BaseModel):
    id: str
    username: str
    must_change_password: bool


class CreateUserRequest(BaseModel):
    username: str
    password: str


class CreatedUserOut(BaseModel):
    id: str
    username: str
    must_change_password: bool


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(title="Sticky Notes API")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    db = _load_db()
    user = next((u for u in db["users"] if u["id"] == user_id), None)
    if user is None:
        raise credentials_exception
    return user


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.post("/api/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = _load_db()
    user = next((u for u in db["users"] if u["username"] == form_data.username), None)
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    token = create_access_token(
        {"sub": user["id"]},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(
        access_token=token,
        token_type="bearer",
        must_change_password=user["must_change_password"],
    )


@app.get("/api/me", response_model=UserOut)
def me(current_user: dict = Depends(get_current_user)):
    return UserOut(
        id=current_user["id"],
        username=current_user["username"],
        must_change_password=current_user["must_change_password"],
    )


@app.post("/api/change-password")
def change_password(
    body: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
):
    if not verify_password(body.current_password, current_user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    db = _load_db()
    for u in db["users"]:
        if u["id"] == current_user["id"]:
            u["password_hash"] = hash_password(body.new_password)
            u["must_change_password"] = False
            break
    _save_db(db)
    return {"message": "Password updated successfully"}


@app.post("/api/users", response_model=CreatedUserOut)
def create_user(
    body: CreateUserRequest,
    current_user: dict = Depends(get_current_user),
):
    if current_user["username"] != "test":
        raise HTTPException(status_code=403, detail="Only the test user can create users")

    username = body.username.strip()
    password = body.password.strip()

    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    db = _load_db()
    if any(u["username"].lower() == username.lower() for u in db["users"]):
        raise HTTPException(status_code=400, detail="Username already exists")

    user = {
        "id": str(uuid.uuid4()),
        "username": username,
        "password_hash": hash_password(password),
        "must_change_password": True,
    }
    db["users"].append(user)
    _save_db(db)
    return CreatedUserOut(
        id=user["id"],
        username=user["username"],
        must_change_password=user["must_change_password"],
    )


@app.post("/api/notes", response_model=NoteOut)
def create_note(
    body: NoteCreate,
    current_user: dict = Depends(get_current_user),
):
    if current_user["must_change_password"]:
        raise HTTPException(status_code=403, detail="Password change required before creating notes")

    note = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "title": body.title,
        "content": body.content,
        "color": body.color or "#fff7a8",
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    db = _load_db()
    db["notes"].append(note)
    _save_db(db)
    return NoteOut(**note)


@app.get("/api/notes", response_model=list[NoteOut])
def search_notes(
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    if current_user["must_change_password"]:
        raise HTTPException(status_code=403, detail="Password change required before viewing notes")

    db = _load_db()
    notes = [n for n in db["notes"] if n["user_id"] == current_user["id"]]

    if search:
        q = search.lower()
        notes = [
            n for n in notes
            if q in n["title"].lower() or q in n["content"].lower()
        ]

    # Most recent first
    notes.sort(key=lambda n: n["created_at"], reverse=True)
    return [NoteOut(**n) for n in notes]


@app.get("/health")
def health():
    return {"status": "ok"}
