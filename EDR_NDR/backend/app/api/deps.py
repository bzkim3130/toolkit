from dataclasses import dataclass

from fastapi import Query


@dataclass
class Pagination:
    page: int
    page_size: int

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


def pagination(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=200)) -> Pagination:
    return Pagination(page=page, page_size=page_size)
