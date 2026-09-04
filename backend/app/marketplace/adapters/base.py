from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any


class BaseMarketplaceAdapter(ABC):
    """
    Abstract interface for external marketplace provider adapters.
    Isolates external API wire formats from Kharridlo's internal domain models.
    """

    @property
    @abstractmethod
    def provider_code(self) -> str:
        """Unique identifier code for the provider (e.g., 'amazon', 'flipkart')."""
        pass

    @property
    @abstractmethod
    def display_name(self) -> str:
        """Human-readable provider label (e.g., 'Amazon.in', 'Flipkart')."""
        pass

    @abstractmethod
    def is_enabled(self) -> bool:
        """Whether the provider is currently enabled in configuration."""
        pass

    @abstractmethod
    def is_live_configured(self) -> bool:
        """Whether valid live API credentials are configured in the environment."""
        pass

    @abstractmethod
    def search_products(
        self,
        query: str,
        category: Optional[str] = None,
        min_price_paise: Optional[int] = None,
        max_price_paise: Optional[int] = None,
        limit: int = 20,
        offset: int = 0,
        correlation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Execute product search against provider API or verified fixtures.
        Returns normalized dictionary with 'products', 'total', and 'warnings'.
        """
        pass

    @abstractmethod
    def get_product(
        self,
        provider_product_id: str,
        correlation_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch single product details by external ID (ASIN / FSN).
        Returns normalized dictionary or None if not found.
        """
        pass

    @abstractmethod
    def health_check(self) -> Dict[str, Any]:
        """Return provider health status, latency, and capability report."""
        pass

    @abstractmethod
    def normalize_product(self, raw_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Convert raw provider payload into Kharridlo normalized product dictionary."""
        pass

    @abstractmethod
    def normalize_offer(self, raw_offer: Dict[str, Any]) -> Dict[str, Any]:
        """Convert raw offer payload into Kharridlo normalized offer dictionary."""
        pass
